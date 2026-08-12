// ABOUTME: Unit tests for BookPreviewCacheComputer — verifies whole-book PDF assembly and metric wiring.
// ABOUTME: Chromium is an injected fake; the real DOM offset extraction is proven in the E2E phase.
// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { BookPreviewCacheComputer } from './BookPreviewCacheComputer';
import type { BrowserHandle, BrowserLauncher, PageHandle, PdfPrintOptions } from '@/application/interfaces/BrowserLauncher';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { WholeBookHtmlAssembler } from './WholeBookHtmlAssembler';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

const MOCK_PDF = Buffer.from('%PDF-1.7 whole book');
const CANNED_METRICS = {
  totalPageCount: 120,
  frontMatterPageCount: 4,
  chapterOffsets: [
    { chapterId: 'ch-1', pageNumber: 5 },
    { chapterId: 'ch-2', pageNumber: 41 },
  ],
  subtitleOffsets: [{ anchorId: 'chapter-ch-1-soustitre-0', pageNumber: 6 }],
};

function makeFake() {
  const setContent = vi.fn().mockResolvedValue(undefined);
  const pdf = vi.fn<(opts?: PdfPrintOptions) => Promise<Buffer>>().mockResolvedValue(MOCK_PDF);
  const page: PageHandle = {
    setContent,
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    pdf,
    // First evaluate = pagedError probe (null = no error); second = metrics extraction.
    evaluate: vi.fn().mockResolvedValueOnce(null).mockResolvedValue(CANNED_METRICS),
  };
  const browser: BrowserHandle = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const launcher: BrowserLauncher = { launch: vi.fn().mockResolvedValue(browser) };
  return { launcher, setContent, pdf, browser };
}

// Chromium is faked above; the renderer and assembler are real, so tests can assert
// on the actual generated HTML (TOC markup, subtitle anchors, design classes, ...).
function makeComputer(launcher: BrowserLauncher, clock: () => Date = () => new Date()): BookPreviewCacheComputer {
  return new BookPreviewCacheComputer(launcher, clock, new PagedJsRenderer(), new WholeBookHtmlAssembler(new TipTapToBookHtml()));
}

const para = (text: string): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const input = () => ({
  projectId: 'proj-1',
  ownerId: 'owner-1',
  profile: PublicationProfile.kdpSixByNine(),
  chapters: [
    { id: 'ch-1', title: 'Chapitre 1', content: para('Un.') },
    { id: 'ch-2', title: 'Chapitre 2', content: para('Deux.') },
  ],
  frontMatter: { title: 'Mon Roman', dedicationContent: 'À toi' },
  contentHash: 'hash-1',
  assetBaseUrl: 'http://localhost:3000',
});

describe('BookPreviewCacheComputer', () => {
  it('returns the rendered PDF and a cache entry carrying the extracted metrics', async () => {
    const { launcher } = makeFake();
    const computer = makeComputer(launcher, () => new Date('2026-07-05T10:00:00Z'));

    const { entry, pdf } = await computer.compute(input());

    expect(pdf.equals(MOCK_PDF)).toBe(true);
    expect(entry.getProjectId()).toBe('proj-1');
    expect(entry.getProfileId()).toBe('kdp-6x9');
    expect(entry.getOwnerId()).toBe('owner-1');
    expect(entry.getContentHash()).toBe('hash-1');
    expect(entry.getTotalPageCount()).toBe(120);
    expect(entry.getFrontMatterPageCount()).toBe(4);
    expect(entry.pageForChapter('ch-2')).toBe(41);
    expect(entry.getComputedAt()).toEqual(new Date('2026-07-05T10:00:00Z'));
  });

  it('renders liminals and restarts body numbering (front matter + folio numbering present)', async () => {
    const { launcher, setContent } = makeFake();
    const computer = makeComputer(launcher);

    await computer.compute(input());

    const html = setContent.mock.calls[0][0] as string;
    expect(html).toContain('Mon Roman'); // front matter title page
    expect(html).toContain('Table des matières'); // TOC (2 chapters)
    // Liminal pages carry upper-roman folios and the body restarts at 1. Both are resolved
    // from the physical page boxes after pagination, so the CSS only reserves an empty
    // footer box and the folio pass fills it in.
    const liminalBlock = html.slice(html.indexOf('@page liminal-page'));
    expect(liminalBlock).toContain('content: none');
    expect(html).toContain('resolveBookFolios');
  });

  it('prints the PDF at the active profile geometry (A5 differs from KDP)', async () => {
    const { launcher, pdf } = makeFake();
    const computer = makeComputer(launcher);

    await computer.compute({ ...input(), profile: PublicationProfile.a5() });

    const opts = pdf.mock.calls[0][0] as PdfPrintOptions;
    expect(opts.width).toBe('5.83in');
    expect(opts.height).toBe('8.27in');
  });

  describe('toc settings (depth + style)', () => {
    const subtitleDoc = (title: string, subtitle: string): JSONContent => ({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: title }] },
        { type: 'heading', attrs: { level: 2, semanticRole: 'sous-titre' }, content: [{ type: 'text', text: subtitle }] },
      ],
    });

    it('tags sous-titre headings with anchors when tocDepth is "chapters-and-subtitles"', async () => {
      const { launcher, setContent } = makeFake();
      const computer = makeComputer(launcher);

      await computer.compute({
        ...input(),
        chapters: [{ id: 'ch-1', title: 'Chapitre 1', content: subtitleDoc('Chapitre 1', 'Sous-titre A') }],
        tocDepth: 'chapters-and-subtitles',
      });

      const html = setContent.mock.calls[0][0] as string;
      expect(html).toContain('id="chapter-ch-1-soustitre-0"');
    });

    it('does not tag sous-titre headings when tocDepth is omitted (unchanged default)', async () => {
      const { launcher, setContent } = makeFake();
      const computer = makeComputer(launcher);

      await computer.compute({
        ...input(),
        chapters: [{ id: 'ch-1', title: 'Chapitre 1', content: subtitleDoc('Chapitre 1', 'Sous-titre A') }],
      });

      const html = setContent.mock.calls[0][0] as string;
      expect(html).not.toContain('id="chapter-ch-1-soustitre-0"');
    });

    it('passes tocStyle through to the rendered nav design class', async () => {
      const { launcher, setContent } = makeFake();
      const computer = makeComputer(launcher);

      await computer.compute({ ...input(), tocStyle: 'epure' });

      const html = setContent.mock.calls[0][0] as string;
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--epure/);
    });

    it('extracts subtitleOffsets metrics into the cache entry', async () => {
      const { launcher } = makeFake();
      const computer = makeComputer(launcher);

      const { entry } = await computer.compute({ ...input(), tocDepth: 'chapters-and-subtitles' });

      expect(entry.getSubtitleOffsets()).toEqual([{ anchorId: 'chapter-ch-1-soustitre-0', pageNumber: 6 }]);
      expect(entry.pageForSubtitle('chapter-ch-1-soustitre-0')).toBe(6);
    });
  });

  describe('endnote compilation', () => {
    const withNote = (title: string, noteText: string): JSONContent => ({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: title }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Corps' },
            { type: 'endnoteRef', attrs: { content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: noteText }] }] } } },
          ],
        },
      ],
    });

    it('compiles a notes section with the custom title and round-trip links', async () => {
      const { launcher, setContent } = makeFake();
      const computer = makeComputer(launcher);

      await computer.compute({
        ...input(),
        chapters: [
          { id: 'ch-1', title: 'Chapitre 1', content: withNote('Chapitre 1', 'Première note') },
          { id: 'ch-2', title: 'Chapitre 2', content: withNote('Chapitre 2', 'Seconde note') },
        ],
        endnotesTitle: 'Références',
      });

      const html = setContent.mock.calls[0][0] as string;
      expect(html).toContain('class="back-matter endnotes"');
      expect(html).toContain('>Références</h2>');
      // Body call links forward; note links back — the round trip.
      expect(html).toContain('id="endnote-call-chapter-ch-1-1"');
      expect(html).toContain('id="endnote-note-chapter-ch-1-1"');
      expect(html).toContain('href="#endnote-call-chapter-ch-1-1"');
    });

    it('adds a "Notes" entry to the table of contents by default', async () => {
      const { launcher, setContent } = makeFake();
      const computer = makeComputer(launcher);

      await computer.compute({
        ...input(),
        chapters: [
          { id: 'ch-1', title: 'Chapitre 1', content: withNote('Chapitre 1', 'n1') },
          { id: 'ch-2', title: 'Chapitre 2', content: withNote('Chapitre 2', 'n2') },
        ],
      });

      const html = setContent.mock.calls[0][0] as string;
      expect(html).toContain('href="#endnotes-section"');
    });
  });
});
