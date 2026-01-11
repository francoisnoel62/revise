// ABOUTME: Unit test suite for PdfExporter validating PDF file generation
// ABOUTME: Tests document creation, paragraph handling, and format validation

import { describe, it, expect, beforeEach } from 'vitest';
import { PdfExporter } from './PdfExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('PdfExporter', () => {
  let exporter: PdfExporter;

  beforeEach(() => {
    exporter = new PdfExporter();
  });

  describe('supports', () => {
    it('should support .pdf files', () => {
      expect(exporter.supports('output.pdf')).toBe(true);
      expect(exporter.supports('output.PDF')).toBe(true);
      expect(exporter.supports('path/to/output.pdf')).toBe(true);
    });

    it('should not support non-pdf files', () => {
      expect(exporter.supports('output.docx')).toBe(false);
      expect(exporter.supports('output.txt')).toBe(false);
      expect(exporter.supports('output.doc')).toBe(false);
    });
  });

  describe('export', () => {
    it('should generate valid PDF buffer', async () => {
      const content = 'This is a test document.';
      const filename = 'test.pdf';

      const buffer = await exporter.export(content, filename);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // A valid PDF starts with %PDF
      expect(buffer[0]).toBe(0x25); // '%'
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x44); // 'D'
      expect(buffer[3]).toBe(0x46); // 'F'
    });

    it('should handle multiline content', async () => {
      const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';

      const buffer = await exporter.export(content, 'multiline.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const buffer = await exporter.export('', 'empty.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      await expect(async () => {
        await exporter.export('content', 'output.docx');
      }).rejects.toThrow('Unsupported file format: output.docx');
    });

    it('should preserve special characters', async () => {
      const content = 'Special chars: "quotes" & ampersand < > symbols';

      const buffer = await exporter.export(content, 'special.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('exportChapter', () => {
    it('should export single chapter to PDF', async () => {
      const tipTapContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Chapter content here.' }],
          },
        ],
      });

      const chapter = new Chapter('ch-1', 'Chapter One', tipTapContent, 0);
      const buffer = await exporter.exportChapter(chapter, 'chapter.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(0x25); // '%'
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x44); // 'D'
      expect(buffer[3]).toBe(0x46); // 'F'
    });

    it('should handle chapter with formatting marks', async () => {
      const tipTapContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Normal text ' },
              { type: 'text', text: 'bold text', marks: [{ type: 'bold' }] },
              { type: 'text', text: ' and ' },
              { type: 'text', text: 'italic text', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      });

      const chapter = new Chapter('ch-1', 'Formatted Chapter', tipTapContent, 0);
      const buffer = await exporter.exportChapter(chapter, 'formatted.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      const chapter = new Chapter('ch-1', 'Chapter One', '{"type":"doc","content":[]}', 0);

      await expect(async () => {
        await exporter.exportChapter(chapter, 'chapter.docx');
      }).rejects.toThrow('Unsupported export format: chapter.docx');
    });
  });

  describe('exportProject', () => {
    it('should export project with multiple chapters', async () => {
      const chapter1Content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First chapter content.' }],
          },
        ],
      });

      const chapter2Content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Second chapter content.' }],
          },
        ],
      });

      const chapters = [
        new Chapter('ch-1', 'Chapter One', chapter1Content, 0),
        new Chapter('ch-2', 'Chapter Two', chapter2Content, 1),
      ];

      const project = new Project(
        'proj-1',
        'user-1',
        'My Novel',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'project.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(0x25); // '%'
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x44); // 'D'
      expect(buffer[3]).toBe(0x46); // 'F'
    });

    it('should handle project with empty chapters', async () => {
      const emptyContent = JSON.stringify({
        type: 'doc',
        content: [],
      });

      const chapters = [new Chapter('ch-1', 'Empty Chapter', emptyContent, 0)];

      const project = new Project(
        'proj-1',
        'user-1',
        'Empty Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'empty.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      const chapters = [new Chapter('ch-1', 'Chapter', '{"type":"doc","content":[]}', 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      await expect(async () => {
        await exporter.exportProject(project, 'project.docx');
      }).rejects.toThrow('Unsupported export format: project.docx');
    });

    it('should handle text alignment attributes', async () => {
      const contentWithAlignment = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: 'center' },
            content: [{ type: 'text', text: 'Centered text' }],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'right' },
            content: [{ type: 'text', text: 'Right aligned text' }],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'justify' },
            content: [{ type: 'text', text: 'Justified text content here.' }],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Aligned Chapter', contentWithAlignment, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Aligned Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'aligned.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle first-line indent', async () => {
      const contentWithIndent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { indent: true },
            content: [{ type: 'text', text: 'This paragraph has a first-line indent.' }],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Indented Chapter', contentWithIndent, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Indented Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'indented.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle highlight marks', async () => {
      const contentWithHighlight = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Highlighted text',
                marks: [{ type: 'highlight', attrs: { color: '#fbbf24' } }],
              },
            ],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Highlighted Chapter', contentWithHighlight, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Highlighted Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'highlighted.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle headings', async () => {
      const contentWithHeadings = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Section Title' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Section content.' }],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Chapter with Headings', contentWithHeadings, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Project with Headings',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'headings.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle underline and combined marks', async () => {
      const contentWithCombinedMarks = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bold and underlined',
                marks: [{ type: 'bold' }, { type: 'underline' }],
              },
            ],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Combined Marks', contentWithCombinedMarks, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Combined Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      const buffer = await exporter.exportProject(project, 'combined.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle non-WinAnsi characters (Turkish, Polish, etc.)', async () => {
      const contentWithSpecialChars = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Turkish: İstanbul, kapı, ışık',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Polish: Łódź, żółć, gęś',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Smart quotes: \u201CHello\u201D and \u2018World\u2019',
              },
            ],
          },
        ],
      });

      const chapters = [new Chapter('ch-1', 'Special Characters', contentWithSpecialChars, 0)];
      const project = new Project(
        'proj-1',
        'user-1',
        'Special Chars Project',
        chapters,
        'ch-1',
        null,
        new Date(),
        new Date()
      );

      // Should not throw an error - characters are normalized
      const buffer = await exporter.exportProject(project, 'special-chars.pdf');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(0x25); // '%'
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x44); // 'D'
      expect(buffer[3]).toBe(0x46); // 'F'
    });
  });
});
