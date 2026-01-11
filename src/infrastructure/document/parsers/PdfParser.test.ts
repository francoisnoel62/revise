// ABOUTME: Tests for PdfParser implementation
// ABOUTME: Tests supports(), parse(), and parseToChapters() methods

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfParser } from './PdfParser';

// Mock the pdf utilities
vi.mock('../utils/pdf-text-extraction', () => ({
  extractPdfText: vi.fn(),
  getPdfOutline: vi.fn(),
  isPdfScanned: vi.fn(),
  calculateMedianFontSize: vi.fn(),
}));

vi.mock('../utils/pdf-chapter-detection', () => ({
  detectChapters: vi.fn(),
}));

vi.mock('../utils/pdf-formatting', () => ({
  groupIntoParagraphs: vi.fn(),
  buildTipTapNode: vi.fn(),
}));

import {
  extractPdfText,
  getPdfOutline,
  isPdfScanned,
  calculateMedianFontSize,
} from '../utils/pdf-text-extraction';
import { detectChapters } from '../utils/pdf-chapter-detection';
import { groupIntoParagraphs, buildTipTapNode } from '../utils/pdf-formatting';

describe('PdfParser', () => {
  let parser: PdfParser;

  beforeEach(() => {
    parser = new PdfParser();
    vi.clearAllMocks();
  });

  describe('supports()', () => {
    it('should return true for .pdf files', () => {
      expect(parser.supports('document.pdf')).toBe(true);
      expect(parser.supports('my-file.PDF')).toBe(true);
      expect(parser.supports('test.PdF')).toBe(true);
    });

    it('should return false for non-pdf files', () => {
      expect(parser.supports('document.docx')).toBe(false);
      expect(parser.supports('document.txt')).toBe(false);
      expect(parser.supports('pdf.doc')).toBe(false);
      expect(parser.supports('file')).toBe(false);
    });
  });

  describe('parse()', () => {
    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('test');

      await expect(parser.parse(buffer, 'test.docx')).rejects.toThrow(
        'Unsupported file format: test.docx'
      );
    });

    it('should extract plain text from PDF', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [
            { text: 'Hello ', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 },
            { text: 'World', fontName: '', fontSize: 12, x: 50, y: 0, width: 50, height: 12 },
          ],
          width: 612,
          height: 792,
        },
      ]);

      const result = await parser.parse(buffer, 'test.pdf');

      expect(result).toBe('Hello World');
    });

    it('should handle multiple pages', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [{ text: 'Page 1', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
          width: 612,
          height: 792,
        },
        {
          pageNumber: 2,
          items: [{ text: 'Page 2', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
          width: 612,
          height: 792,
        },
      ]);

      const result = await parser.parse(buffer, 'test.pdf');

      expect(result).toContain('Page 1');
      expect(result).toContain('Page 2');
    });
  });

  describe('parseToChapters()', () => {
    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('test');

      await expect(parser.parseToChapters(buffer, 'test.docx')).rejects.toThrow(
        'Unsupported file format: test.docx'
      );
    });

    it('should throw error for scanned PDF', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(isPdfScanned).mockResolvedValue(true);

      await expect(parser.parseToChapters(buffer, 'test.pdf')).rejects.toThrow(
        'Ce PDF semble être scanné'
      );
    });

    it('should create chapters from detected boundaries', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(isPdfScanned).mockResolvedValue(false);
      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [
            { text: 'Chapter content', fontName: '', fontSize: 12, x: 0, y: 0, width: 100, height: 12 },
          ],
          width: 612,
          height: 792,
        },
      ]);
      vi.mocked(getPdfOutline).mockResolvedValue([]);
      vi.mocked(calculateMedianFontSize).mockReturnValue(12);
      vi.mocked(detectChapters).mockReturnValue([
        {
          title: 'Chapter 1',
          startPageIndex: 0,
          startItemIndex: 0,
          items: [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
        },
      ]);
      vi.mocked(groupIntoParagraphs).mockReturnValue([
        [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
      ]);
      vi.mocked(buildTipTapNode).mockReturnValue({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Content' }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      expect(chapters.length).toBe(1);
      expect(chapters[0].getTitle()).toBe('Chapter 1');
    });

    it('should auto-name chapters without titles', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(isPdfScanned).mockResolvedValue(false);
      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
          width: 612,
          height: 792,
        },
      ]);
      vi.mocked(getPdfOutline).mockResolvedValue([]);
      vi.mocked(calculateMedianFontSize).mockReturnValue(12);
      vi.mocked(detectChapters).mockReturnValue([
        {
          title: '', // No title
          startPageIndex: 0,
          startItemIndex: 0,
          items: [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
        },
      ]);
      vi.mocked(groupIntoParagraphs).mockReturnValue([
        [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
      ]);
      vi.mocked(buildTipTapNode).mockReturnValue({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Content' }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      expect(chapters[0].getTitle()).toBe('Chapitre 1');
    });

    it('should create at least one chapter even when detection returns empty', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(isPdfScanned).mockResolvedValue(false);
      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [{ text: 'Some content', fontName: '', fontSize: 12, x: 0, y: 0, width: 80, height: 12 }],
          width: 612,
          height: 792,
        },
      ]);
      vi.mocked(getPdfOutline).mockResolvedValue([]);
      vi.mocked(calculateMedianFontSize).mockReturnValue(12);
      vi.mocked(detectChapters).mockReturnValue([]); // Empty detection result
      vi.mocked(groupIntoParagraphs).mockReturnValue([
        [{ text: 'Some content', fontName: '', fontSize: 12, x: 0, y: 0, width: 80, height: 12 }],
      ]);
      vi.mocked(buildTipTapNode).mockReturnValue({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Some content' }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      expect(chapters.length).toBe(1);
      expect(chapters[0].getTitle()).toBe('Chapitre 1');
    });

    it('should generate valid TipTap JSON content', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(isPdfScanned).mockResolvedValue(false);
      vi.mocked(extractPdfText).mockResolvedValue([
        {
          pageNumber: 1,
          items: [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
          width: 612,
          height: 792,
        },
      ]);
      vi.mocked(getPdfOutline).mockResolvedValue([]);
      vi.mocked(calculateMedianFontSize).mockReturnValue(12);
      vi.mocked(detectChapters).mockReturnValue([
        {
          title: 'Test',
          startPageIndex: 0,
          startItemIndex: 0,
          items: [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
        },
      ]);
      vi.mocked(groupIntoParagraphs).mockReturnValue([
        [{ text: 'Content', fontName: '', fontSize: 12, x: 0, y: 0, width: 50, height: 12 }],
      ]);
      vi.mocked(buildTipTapNode).mockReturnValue({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Content' }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      const content = JSON.parse(chapters[0].getContent());
      expect(content.type).toBe('doc');
      expect(Array.isArray(content.content)).toBe(true);
    });
  });
});
