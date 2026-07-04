// ABOUTME: Unit tests for BookPreviewCacheComputer — verifies whole-book PDF assembly and metric wiring.
// ABOUTME: Chromium is an injected fake; the real DOM offset extraction is proven in the E2E phase.
// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { BookPreviewCacheComputer } from './BookPreviewCacheComputer';
import type { BrowserHandle, BrowserLauncher, PageHandle, PdfPrintOptions } from '@/infrastructure/document/paged/BrowserLauncher';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const MOCK_PDF = Buffer.from('%PDF-1.7 whole book');
const CANNED_METRICS = {
  totalPageCount: 120,
  frontMatterPageCount: 4,
  chapterOffsets: [
    { chapterId: 'ch-1', pageNumber: 5 },
    { chapterId: 'ch-2', pageNumber: 41 },
  ],
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
    const computer = new BookPreviewCacheComputer(launcher, () => new Date('2026-07-05T10:00:00Z'));

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

  it('renders liminals and restarts body numbering (front matter + body-matter reset present)', async () => {
    const { launcher, setContent } = makeFake();
    const computer = new BookPreviewCacheComputer(launcher, () => new Date());

    await computer.compute(input());

    const html = setContent.mock.calls[0][0] as string;
    expect(html).toContain('Mon Roman'); // front matter title page
    expect(html).toContain('Table des matières'); // TOC (2 chapters)
    expect(html).toContain('.body-matter { counter-reset: page 0; }'); // Arabic restart
  });

  it('prints the PDF at the active profile geometry (A5 differs from KDP)', async () => {
    const { launcher, pdf } = makeFake();
    const computer = new BookPreviewCacheComputer(launcher, () => new Date());

    await computer.compute({ ...input(), profile: PublicationProfile.a5() });

    const opts = pdf.mock.calls[0][0] as PdfPrintOptions;
    expect(opts.width).toBe('5.83in');
    expect(opts.height).toBe('8.27in');
  });
});
