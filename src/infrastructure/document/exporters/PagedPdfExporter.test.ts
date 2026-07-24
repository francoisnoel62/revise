// ABOUTME: Unit tests for PagedPdfExporter — verifies paged pipeline wiring and PDF output contract.
// ABOUTME: Chromium is replaced by an injected fake launcher so tests run without a real browser.
// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PagedPdfExporter } from './PagedPdfExporter';
import type { BrowserHandle, BrowserLauncher, PageHandle } from '@/application/interfaces/BrowserLauncher';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

const ASSET_BASE_URL = 'http://localhost:3000';
const MOCK_PDF = Buffer.from('%PDF-1.4 mock');

function makeFakePage(): PageHandle & { _pdf: ReturnType<typeof vi.fn>; _close?: ReturnType<typeof vi.fn> } {
  const _pdf = vi.fn().mockResolvedValue(MOCK_PDF);
  return {
    setContent: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    pdf: _pdf,
    evaluate: vi.fn().mockResolvedValue(undefined),
    _pdf,
  };
}

function makeFakeLauncher(): { launcher: BrowserLauncher; page: ReturnType<typeof makeFakePage>; browser: BrowserHandle } {
  const page = makeFakePage();
  const browser: BrowserHandle = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const launcher: BrowserLauncher = {
    launch: vi.fn().mockResolvedValue(browser),
  };
  return { launcher, page, browser };
}

function makeChapter(id: string, title: string, content?: object): Chapter {
  const tipTap = JSON.stringify(
    content ?? {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texte du chapitre.' }] }],
    }
  );
  return new Chapter(id, title, tipTap, 0);
}

function makeProject(chapters: Chapter[]): Project {
  return new Project('proj-1', 'user-1', 'Mon Roman', chapters, chapters[0]?.getId() ?? null, null, new Date(), new Date());
}

describe('PagedPdfExporter', () => {
  let fake: ReturnType<typeof makeFakeLauncher>;
  let exporter: PagedPdfExporter;

  beforeEach(() => {
    fake = makeFakeLauncher();
    exporter = new PagedPdfExporter(ASSET_BASE_URL, fake.launcher);
  });

  describe('supports', () => {
    it('returns true for .pdf files', () => {
      expect(exporter.supports('output.pdf')).toBe(true);
      expect(exporter.supports('output.PDF')).toBe(true);
    });

    it('returns false for non-pdf files', () => {
      expect(exporter.supports('output.docx')).toBe(false);
      expect(exporter.supports('output.txt')).toBe(false);
    });
  });

  describe('exportProject', () => {
    it('returns a Buffer', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      const result = await exporter.exportProject(project, 'roman.pdf');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('launches with headless: true', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf');
      expect(fake.launcher.launch).toHaveBeenCalledWith({ headless: true });
    });

    it('closes the browser even if pdf() throws', async () => {
      fake.page._pdf.mockRejectedValueOnce(new Error('Chromium failure'));
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await expect(exporter.exportProject(project, 'roman.pdf')).rejects.toThrow('Chromium failure');
      expect(fake.browser.close).toHaveBeenCalled();
    });

    it('throws for unsupported format', async () => {
      const project = makeProject([makeChapter('ch-1', 'Titre')]);
      await expect(exporter.exportProject(project, 'roman.docx')).rejects.toThrow(
        'Unsupported export format: roman.docx'
      );
    });
  });

  describe('exportChapters', () => {
    it('returns a Buffer from paged pipeline', async () => {
      const chapters = [makeChapter('ch-1', 'Un'), makeChapter('ch-2', 'Deux')];
      const result = await exporter.exportChapters(chapters, 'export.pdf');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('throws when chapter list is empty', async () => {
      await expect(exporter.exportChapters([], 'export.pdf')).rejects.toThrow('No chapters to export');
    });

    it('throws for unsupported format', async () => {
      await expect(
        exporter.exportChapters([makeChapter('ch-1', 'Un')], 'export.docx')
      ).rejects.toThrow('Unsupported export format: export.docx');
    });
  });

  describe('exportChapter', () => {
    it('returns a Buffer', async () => {
      const result = await exporter.exportChapter(makeChapter('ch-1', 'Chapitre Un'), 'chapitre.pdf');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('throws for unsupported format', async () => {
      await expect(
        exporter.exportChapter(makeChapter('ch-1', 'Un'), 'chapitre.txt')
      ).rejects.toThrow('Unsupported export format: chapitre.txt');
    });
  });

  describe('export (plain text)', () => {
    it('returns a Buffer from plain text content', async () => {
      const result = await exporter.export('Bonjour le monde.', 'doc.pdf');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('throws for unsupported format', async () => {
      await expect(exporter.export('content', 'doc.docx')).rejects.toThrow(
        'Unsupported file format: doc.docx'
      );
    });
  });

  describe('presentation stripping (profile typography wins)', () => {
    // A manuscript heading carries an inline textAlign (the editor's default is 'justify').
    // If it leaks into the rendered HTML as an inline style, it out-specifies the profile's
    // [data-semantic-role] centering rule and the title renders left. The export must strip it.
    const inlineAlignContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, semanticRole: 'titre-de-chapitre', textAlign: 'justify' },
          content: [{ type: 'text', text: 'Chapitre Un' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'right' },
          content: [{ type: 'text', text: 'Corps du texte.' }],
        },
      ],
    };

    it('strips inline textAlign from exported chapter HTML', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un', inlineAlignContent)]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).not.toMatch(/style="[^"]*text-align/);
      expect(html).toContain('<h1 data-semantic-role="titre-de-chapitre">Chapitre Un</h1>');
    });
  });

  describe('front matter integration', () => {
    it('includes front matter pages in rendered HTML when frontMatter option is provided', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf', {
        frontMatter: { title: 'Mon Roman', authorName: 'Auteur Test' },
      });
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('half-title');
      expect(html).toContain('Mon Roman');
      expect(html).toContain('Auteur Test');
    });

    it('includes TOC in rendered HTML when exporting multiple chapters', async () => {
      const project = makeProject([
        makeChapter('ch-1', 'Chapitre Un'),
        makeChapter('ch-2', 'Chapitre Deux'),
      ]);
      await exporter.exportProject(project, 'roman.pdf', {
        frontMatter: { title: 'Mon Roman' },
      });
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('Table des matières');
      expect(html).toContain('Chapitre Un');
      expect(html).toContain('Chapitre Deux');
    });

    it('wraps chapters in section elements with chapter IDs', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf', {
        frontMatter: { title: 'Mon Roman' },
      });
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toMatch(/id="ch-\d+"/);
      expect(html).toContain('class="chapter"');
    });

    it('does not include front matter when frontMatter option is absent', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).not.toContain('class="book-half-title"');
    });

    it('includes TOC for 2+ chapters even without front matter', async () => {
      const project = makeProject([
        makeChapter('ch-1', 'Chapitre Un'),
        makeChapter('ch-2', 'Chapitre Deux'),
      ]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('Table des matières');
      expect(html).not.toContain('class="book-half-title"');
    });

    it('omits TOC for a single chapter', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).not.toContain('Table des matières');
    });
  });

  describe('endnote compilation', () => {
    const chapterWithNote = (title: string, noteText: string) => ({
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

    it('compiles a notes section with round-trip links in the downloaded PDF', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un', chapterWithNote('Chapitre Un', 'La note'))]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('class="back-matter endnotes"');
      expect(html).toContain('id="endnote-call-ch-0-1"');
      expect(html).toContain('id="endnote-note-ch-0-1"');
      expect(html).toContain('href="#endnote-call-ch-0-1"');
    });

    it('uses the custom endnotes title from the export options', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un', chapterWithNote('Chapitre Un', 'La note'))]);
      await exporter.exportProject(project, 'roman.pdf', { endnotesTitle: 'Références' });
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('>Références</h2>');
    });

    it('does not emit a notes section when no chapter has endnotes', async () => {
      const project = makeProject([makeChapter('ch-1', 'Chapitre Un')]);
      await exporter.exportProject(project, 'roman.pdf');
      const html: string = (fake.page.setContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).not.toContain('class="back-matter endnotes"');
    });
  });
});
