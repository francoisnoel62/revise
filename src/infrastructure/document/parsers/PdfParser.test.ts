// ABOUTME: Tests for PdfParser with AI-powered text structuring
// ABOUTME: Tests supports(), parse(), and parseToChapters() methods

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfParser } from './PdfParser';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';

// Mock unpdf
vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(),
}));

// Mock htmlToTipTapJSON
vi.mock('../utils/tiptap-conversion', () => ({
  htmlToTipTapJSON: vi.fn(),
}));

import { getDocumentProxy } from 'unpdf';
import { htmlToTipTapJSON } from '../utils/tiptap-conversion';

// Helper to create mock PDF document
function createMockPdfDoc(pages: Array<{ items: Array<{ str: string }> }>) {
  return {
    numPages: pages.length,
    getPage: vi.fn().mockImplementation((pageNum: number) => ({
      getTextContent: vi.fn().mockResolvedValue({
        items: pages[pageNum - 1]?.items || [],
      }),
    })),
  };
}

// Helper to create mock LLMProvider
function createMockLLMProvider(structuredHtml: string): LLMProvider {
  return {
    generateRewrites: vi.fn(),
    testConnection: vi.fn(),
    getProviderName: vi.fn().mockReturnValue('Mock'),
    getModel: vi.fn().mockReturnValue('mock-model'),
    generateNarrativeAnalysis: vi.fn(),
    generateStylisticDNA: vi.fn(),
    generateCharacters: vi.fn(),
    generatePlot: vi.fn(),
    generateWorldbuilding: vi.fn(),
    generateSynthesis: vi.fn(),
    structureRawText: vi.fn().mockResolvedValue(structuredHtml),
  };
}

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

    it('should extract raw text from PDF', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Hello ' }, { str: 'World' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      const result = await parser.parse(buffer, 'test.pdf');

      expect(result).toContain('Hello ');
      expect(result).toContain('World');
    });

    it('should handle multiple pages', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Page 1 content' }] },
          { items: [{ str: 'Page 2 content' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      const result = await parser.parse(buffer, 'test.pdf');

      expect(result).toContain('Page 1 content');
      expect(result).toContain('Page 2 content');
    });
  });

  describe('parseToChapters()', () => {
    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('test');

      await expect(parser.parseToChapters(buffer, 'test.docx')).rejects.toThrow(
        'Unsupported file format: test.docx'
      );
    });

    it('should throw error for empty/scanned PDF', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [] }, // Empty page = scanned
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      await expect(parser.parseToChapters(buffer, 'test.pdf')).rejects.toThrow(
        'Ce PDF semble être scanné ou vide'
      );
    });

    it('should create single chapter when no H1 headings (without AI)', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Some content here' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      vi.mocked(htmlToTipTapJSON).mockReturnValue({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Some content here' }] }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      expect(chapters.length).toBe(1);
      expect(chapters[0].getTitle()).toBe('Chapitre 1');
    });

    it('should use AI provider when available', async () => {
      const mockProvider = createMockLLMProvider('<p>AI structured content</p>');
      const parserWithAI = new PdfParser(mockProvider);
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Raw text' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      vi.mocked(htmlToTipTapJSON).mockReturnValue({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI structured content' }] }],
      });

      await parserWithAI.parseToChapters(buffer, 'test.pdf');

      expect(mockProvider.structureRawText).toHaveBeenCalled();
    });

    it('should split by H1 headings from AI response', async () => {
      const mockProvider = createMockLLMProvider(
        '<h1>Chapter One</h1><p>First content</p><h1>Chapter Two</h1><p>Second content</p>'
      );
      const parserWithAI = new PdfParser(mockProvider);
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Raw text' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      vi.mocked(htmlToTipTapJSON).mockReturnValue({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
      });

      const chapters = await parserWithAI.parseToChapters(buffer, 'test.pdf');

      expect(chapters.length).toBe(2);
      expect(chapters[0].getTitle()).toBe('Chapter One');
      expect(chapters[1].getTitle()).toBe('Chapter Two');
    });

    it('should generate valid TipTap JSON content', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Content' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      vi.mocked(htmlToTipTapJSON).mockReturnValue({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
      });

      const chapters = await parser.parseToChapters(buffer, 'test.pdf');

      const content = JSON.parse(chapters[0].getContent());
      expect(content.type).toBe('doc');
      expect(Array.isArray(content.content)).toBe(true);
    });

    it('should preserve whitespace in raw text extraction', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Hello ' }, { str: '' }, { str: 'World' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      vi.mocked(htmlToTipTapJSON).mockReturnValue({
        type: 'doc',
        content: [],
      });

      // The raw text should include the whitespace
      const rawText = await parser.parse(buffer, 'test.pdf');
      expect(rawText).toContain('Hello ');
    });
  });

  describe('fallback simple text to HTML', () => {
    it('should convert double newlines to paragraph breaks', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: 'Paragraph 1' }, { str: '\n\n' }, { str: 'Paragraph 2' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      let capturedHtml = '';
      vi.mocked(htmlToTipTapJSON).mockImplementation((html: string) => {
        capturedHtml = html;
        return { type: 'doc', content: [] };
      });

      await parser.parseToChapters(buffer, 'test.pdf');

      // Without AI, simple fallback splits by double newlines
      expect(capturedHtml).toContain('<p>');
    });

    it('should escape HTML special characters', async () => {
      const buffer = Buffer.from('test');

      vi.mocked(getDocumentProxy).mockResolvedValue(
        createMockPdfDoc([
          { items: [{ str: '<script>alert("xss")</script>' }] },
        ]) as ReturnType<typeof getDocumentProxy> extends Promise<infer T> ? T : never
      );

      let capturedHtml = '';
      vi.mocked(htmlToTipTapJSON).mockImplementation((html: string) => {
        capturedHtml = html;
        return { type: 'doc', content: [] };
      });

      await parser.parseToChapters(buffer, 'test.pdf');

      expect(capturedHtml).not.toContain('<script>');
      expect(capturedHtml).toContain('&lt;script&gt;');
    });
  });
});
