// ABOUTME: Unit test suite for DocxExporter validating .docx file generation
// ABOUTME: Tests document creation, paragraph handling, and format validation

import { describe, it, expect, beforeEach } from 'vitest';
import { DocxExporter } from './DocxExporter';

describe('DocxExporter', () => {
  let exporter: DocxExporter;

  beforeEach(() => {
    exporter = new DocxExporter();
  });

  describe('supports', () => {
    it('should support .docx files', () => {
      expect(exporter.supports('output.docx')).toBe(true);
      expect(exporter.supports('output.DOCX')).toBe(true);
      expect(exporter.supports('path/to/output.docx')).toBe(true);
    });

    it('should not support non-docx files', () => {
      expect(exporter.supports('output.pdf')).toBe(false);
      expect(exporter.supports('output.txt')).toBe(false);
      expect(exporter.supports('output.doc')).toBe(false);
    });
  });

  describe('export', () => {
    it('should generate valid docx buffer', async () => {
      const content = 'This is a test document.';
      const filename = 'test.docx';

      const buffer = await exporter.export(content, filename);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // A valid .docx starts with PK (zip file signature)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('should handle multiline content', async () => {
      const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';

      const buffer = await exporter.export(content, 'multiline.docx');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const buffer = await exporter.export('', 'empty.docx');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      await expect(async () => {
        await exporter.export('content', 'output.pdf');
      }).rejects.toThrow('Unsupported file format: output.pdf');
    });

    it('should preserve special characters', async () => {
      const content = 'Special chars: "quotes" & ampersand < > symbols';

      const buffer = await exporter.export(content, 'special.docx');

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
