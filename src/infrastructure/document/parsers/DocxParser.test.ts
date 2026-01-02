// ABOUTME: Unit test suite for DocxParser validating .docx file parsing
// ABOUTME: Tests document extraction, error handling, and format validation

import { describe, it, expect, beforeEach } from 'vitest';
import { DocxParser } from './DocxParser';

describe('DocxParser', () => {
  let parser: DocxParser;

  beforeEach(() => {
    parser = new DocxParser();
  });

  describe('supports', () => {
    it('should support .docx files', () => {
      expect(parser.supports('document.docx')).toBe(true);
      expect(parser.supports('test.DOCX')).toBe(true);
      expect(parser.supports('path/to/file.docx')).toBe(true);
    });

    it('should not support non-docx files', () => {
      expect(parser.supports('document.pdf')).toBe(false);
      expect(parser.supports('document.txt')).toBe(false);
      expect(parser.supports('document.doc')).toBe(false);
      expect(parser.supports('document')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should throw error for corrupted docx', async () => {
      const invalidBuffer = Buffer.from('This is not a valid docx file');

      await expect(async () => {
        await parser.parse(invalidBuffer, 'corrupted.docx');
      }).rejects.toThrow();
    });

    it('should throw error for unsupported format', async () => {
      const buffer = Buffer.from('content');

      await expect(async () => {
        await parser.parse(buffer, 'file.pdf');
      }).rejects.toThrow('Unsupported file format: file.pdf');
    });
  });
});
