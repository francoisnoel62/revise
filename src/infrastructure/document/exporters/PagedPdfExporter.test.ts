// ABOUTME: Unit tests for PagedPdfExporter — verifies paged pipeline wiring and PDF output contract.
// ABOUTME: Chromium is mocked so tests run without a real browser.
// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock Playwright chromium using vi.hoisted so variables are available in the factory ---
const { mockPage, mockBrowser, mockLaunch } = vi.hoisted(() => {
  const mockPage = {
    setContent: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockLaunch = vi.fn().mockResolvedValue(mockBrowser);
  return { mockPage, mockBrowser, mockLaunch };
});

vi.mock('@playwright/test', () => ({
  chromium: {
    launch: mockLaunch,
  },
}));

import { PagedPdfExporter } from './PagedPdfExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

const ASSET_BASE_URL = 'http://localhost:3000';

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
  let exporter: PagedPdfExporter;

  beforeEach(() => {
    vi.clearAllMocks();
    exporter = new PagedPdfExporter(ASSET_BASE_URL);
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
      const chapter = makeChapter('ch-1', 'Chapitre Un');
      const project = makeProject([chapter]);

      const result = await exporter.exportProject(project, 'roman.pdf');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('launches Chromium with headless: true', async () => {
      const chapter = makeChapter('ch-1', 'Chapitre Un');
      const project = makeProject([chapter]);

      await exporter.exportProject(project, 'roman.pdf');

      expect(mockLaunch).toHaveBeenCalledWith({ headless: true });
    });

    it('closes the browser even if an error occurs', async () => {
      mockPage.pdf.mockRejectedValueOnce(new Error('Chromium failure'));

      const chapter = makeChapter('ch-1', 'Chapitre Un');
      const project = makeProject([chapter]);

      await expect(exporter.exportProject(project, 'roman.pdf')).rejects.toThrow('Chromium failure');
      expect(mockBrowser.close).toHaveBeenCalled();
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
      await expect(exporter.exportChapters([], 'export.pdf')).rejects.toThrow(
        'No chapters to export'
      );
    });

    it('throws for unsupported format', async () => {
      await expect(
        exporter.exportChapters([makeChapter('ch-1', 'Un')], 'export.docx')
      ).rejects.toThrow('Unsupported export format: export.docx');
    });
  });

  describe('exportChapter', () => {
    it('returns a Buffer', async () => {
      const chapter = makeChapter('ch-1', 'Chapitre Un');
      const result = await exporter.exportChapter(chapter, 'chapitre.pdf');
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
});
