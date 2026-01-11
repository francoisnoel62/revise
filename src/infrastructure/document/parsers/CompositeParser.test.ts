// ABOUTME: Tests for CompositeDocumentParser
// ABOUTME: Tests routing to appropriate parser based on file extension

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompositeDocumentParser } from './CompositeParser';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { Chapter } from '@/domain/entities/Chapter';

describe('CompositeDocumentParser', () => {
  // Create mock parsers
  const createMockParser = (extension: string): DocumentParser => ({
    supports: vi.fn((filename: string) => filename.toLowerCase().endsWith(extension)),
    parse: vi.fn().mockResolvedValue('parsed text'),
    parseToChapters: vi.fn().mockResolvedValue([
      new Chapter('1', 'Test Chapter', JSON.stringify({ type: 'doc', content: [] }), 0),
    ]),
  });

  let docxParser: DocumentParser;
  let pdfParser: DocumentParser;
  let compositeParser: CompositeDocumentParser;

  beforeEach(() => {
    docxParser = createMockParser('.docx');
    pdfParser = createMockParser('.pdf');
    compositeParser = new CompositeDocumentParser([docxParser, pdfParser]);
  });

  describe('constructor', () => {
    it('should throw error when no parsers provided', () => {
      expect(() => new CompositeDocumentParser([])).toThrow(
        'CompositeDocumentParser requires at least one parser'
      );
    });

    it('should accept array of parsers', () => {
      expect(() => new CompositeDocumentParser([docxParser])).not.toThrow();
    });
  });

  describe('supports()', () => {
    it('should return true for .docx files', () => {
      expect(compositeParser.supports('document.docx')).toBe(true);
    });

    it('should return true for .pdf files', () => {
      expect(compositeParser.supports('document.pdf')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(compositeParser.supports('document.txt')).toBe(false);
      expect(compositeParser.supports('document.doc')).toBe(false);
    });

    it('should delegate to child parsers', () => {
      compositeParser.supports('test.docx');
      expect(docxParser.supports).toHaveBeenCalledWith('test.docx');
    });
  });

  describe('parse()', () => {
    it('should route .docx to docxParser', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parse(buffer, 'test.docx');

      expect(docxParser.parse).toHaveBeenCalledWith(buffer, 'test.docx');
      expect(pdfParser.parse).not.toHaveBeenCalled();
    });

    it('should route .pdf to pdfParser', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parse(buffer, 'test.pdf');

      expect(pdfParser.parse).toHaveBeenCalledWith(buffer, 'test.pdf');
      expect(docxParser.parse).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('test');

      await expect(compositeParser.parse(buffer, 'test.txt')).rejects.toThrow(
        'Format de fichier non supporté: .txt'
      );
    });

    it('should return result from appropriate parser', async () => {
      const buffer = Buffer.from('test');
      vi.mocked(docxParser.parse).mockResolvedValue('docx content');
      vi.mocked(pdfParser.parse).mockResolvedValue('pdf content');

      const docxResult = await compositeParser.parse(buffer, 'test.docx');
      const pdfResult = await compositeParser.parse(buffer, 'test.pdf');

      expect(docxResult).toBe('docx content');
      expect(pdfResult).toBe('pdf content');
    });
  });

  describe('parseToChapters()', () => {
    it('should route .docx to docxParser', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parseToChapters(buffer, 'test.docx');

      expect(docxParser.parseToChapters).toHaveBeenCalledWith(buffer, 'test.docx');
      expect(pdfParser.parseToChapters).not.toHaveBeenCalled();
    });

    it('should route .pdf to pdfParser', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parseToChapters(buffer, 'test.pdf');

      expect(pdfParser.parseToChapters).toHaveBeenCalledWith(buffer, 'test.pdf');
      expect(docxParser.parseToChapters).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('test');

      await expect(compositeParser.parseToChapters(buffer, 'test.txt')).rejects.toThrow(
        'Format de fichier non supporté: .txt'
      );
    });

    it('should return chapters from appropriate parser', async () => {
      const buffer = Buffer.from('test');
      const docxChapter = new Chapter('doc1', 'DOCX Chapter', JSON.stringify({ type: 'doc', content: [] }), 0);
      const pdfChapter = new Chapter('pdf1', 'PDF Chapter', JSON.stringify({ type: 'doc', content: [] }), 0);

      vi.mocked(docxParser.parseToChapters).mockResolvedValue([docxChapter]);
      vi.mocked(pdfParser.parseToChapters).mockResolvedValue([pdfChapter]);

      const docxResult = await compositeParser.parseToChapters(buffer, 'test.docx');
      const pdfResult = await compositeParser.parseToChapters(buffer, 'test.pdf');

      expect(docxResult[0].getTitle()).toBe('DOCX Chapter');
      expect(pdfResult[0].getTitle()).toBe('PDF Chapter');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return list of supported extensions', () => {
      const extensions = compositeParser.getSupportedExtensions();

      expect(extensions).toContain('.docx');
      expect(extensions).toContain('.pdf');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase extensions', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parseToChapters(buffer, 'TEST.PDF');

      expect(pdfParser.parseToChapters).toHaveBeenCalled();
    });

    it('should handle mixed case extensions', async () => {
      const buffer = Buffer.from('test');

      await compositeParser.parseToChapters(buffer, 'document.PdF');

      expect(pdfParser.parseToChapters).toHaveBeenCalled();
    });
  });
});
