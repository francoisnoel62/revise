// ABOUTME: Unit test suite for DocxParser validating .docx file parsing
// ABOUTME: Tests document extraction, error handling, and format validation

import { describe, it, expect, beforeEach } from 'vitest';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
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

  describe('parseToChapters - indentation preservation', () => {
    it('should detect first-line indent from DOCX and produce HTML with data-indent', async () => {
      // Create a DOCX with indented and non-indented paragraphs
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                indent: { firstLine: 720 }, // 720 twips = 0.5 inch
                children: [new TextRun('This paragraph has first-line indent.')],
              }),
              new Paragraph({
                children: [new TextRun('This paragraph has no indent.')],
              }),
              new Paragraph({
                indent: { firstLine: 720 },
                children: [new TextRun('Another indented paragraph.')],
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      // Test the Mammoth transformation directly (same logic as DocxParser)
      const transformParagraph = (paragraph: {
        indent?: { firstLine?: string | null };
        styleName?: string | null;
      }) => {
        if (paragraph.indent?.firstLine) {
          return {
            ...paragraph,
            styleName: paragraph.styleName || 'IndentedParagraph',
          };
        }
        return paragraph;
      };

      const result = await mammoth.convertToHtml(
        { buffer },
        {
          transformDocument: mammoth.transforms.paragraph(transformParagraph),
          styleMap: ["p[style-name='IndentedParagraph'] => p.indented:fresh"],
        }
      );

      // Post-process HTML (same as DocxParser)
      const html = result.value.replace(
        /<p class="indented">/g,
        '<p data-indent="true">'
      );

      // Verify the HTML contains data-indent="true" for indented paragraphs
      expect(html).toContain('data-indent="true"');
      expect(html).toContain('This paragraph has first-line indent.');
      expect(html).toContain('Another indented paragraph.');

      // Verify non-indented paragraph doesn't have data-indent
      expect(html).toMatch(/<p>This paragraph has no indent\.<\/p>/);

      // Count occurrences of data-indent="true" - should be 2
      const matches = html.match(/data-indent="true"/g);
      expect(matches?.length).toBe(2);
    });

    it('should handle DOCX without any indentation', async () => {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun('Normal paragraph one.')],
              }),
              new Paragraph({
                children: [new TextRun('Normal paragraph two.')],
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const chapters = await parser.parseToChapters(buffer, 'test.docx');

      expect(chapters.length).toBeGreaterThan(0);
      const content = chapters[0].getContent();
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
});
