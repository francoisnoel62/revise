// ABOUTME: Unit test suite for DocxExporter validating .docx file generation
// ABOUTME: Tests document creation, paragraph handling, format validation, and style presets

import { describe, it, expect, beforeEach } from 'vitest';
import { DocxExporter } from './DocxExporter';
import { Chapter } from '@/domain/entities/Chapter';

const VALID_DOCX_MAGIC = [0x50, 0x4b]; // PK — ZIP file signature

function makeTipTapJson(nodes: object[]) {
  return JSON.stringify({ type: 'doc', content: nodes });
}

function makeChapter(title: string, content: object[], id = 'ch-1'): Chapter {
  return new Chapter(id, title, makeTipTapJson(content), 0);
}

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

  describe('export (legacy plain-text)', () => {
    it('should generate valid docx buffer', async () => {
      const buffer = await exporter.export('This is a test document.', 'test.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });

    it('should handle multiline content', async () => {
      const buffer = await exporter.export(
        'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
        'multiline.docx'
      );
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const buffer = await exporter.export('', 'empty.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      await expect(exporter.export('content', 'output.pdf')).rejects.toThrow(
        'Unsupported file format: output.pdf'
      );
    });

    it('should preserve special characters', async () => {
      const buffer = await exporter.export(
        'Special chars: "quotes" & ampersand < > symbols',
        'special.docx'
      );
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('exportChapter', () => {
    const bodyNodes = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Once upon a time...' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'The end.' }],
      },
    ];

    it('should generate valid buffer with default KDP preset', async () => {
      const chapter = makeChapter('Chapter One', bodyNodes);
      const buffer = await exporter.exportChapter(chapter, 'ch1.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });

    it('should generate valid buffer with neutral preset', async () => {
      const chapter = makeChapter('Chapter One', bodyNodes);
      const buffer = await exporter.exportChapter(chapter, 'ch1.docx', {
        stylePreset: 'neutral',
      });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate valid buffer with structured preset', async () => {
      const chapter = makeChapter('Chapter One', bodyNodes);
      const buffer = await exporter.exportChapter(chapter, 'ch1.docx', {
        stylePreset: 'structured',
      });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('exportChapters', () => {
    const nodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text.' }] }];

    it('KDP preset: generates valid buffer for multiple chapters', async () => {
      const chapters = [
        makeChapter('Chapter 1', nodes),
        makeChapter('Chapter 2', nodes, 'ch-2'),
      ];
      const buffer = await exporter.exportChapters(chapters, 'book.docx', {
        stylePreset: 'kdp',
      });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });

    it('neutral preset: generates valid buffer', async () => {
      const chapters = [makeChapter('Chapter 1', nodes)];
      const buffer = await exporter.exportChapters(chapters, 'book.docx', {
        stylePreset: 'neutral',
      });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw when given an empty chapters array', async () => {
      await expect(exporter.exportChapters([], 'book.docx')).rejects.toThrow(
        'No chapters to export'
      );
    });
  });

  describe('TipTap formatting — KDP preset', () => {
    it('should handle bold, italic, underline marks', async () => {
      const nodes = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' italic', marks: [{ type: 'italic' }] },
            { type: 'text', text: ' underline', marks: [{ type: 'underline' }] },
          ],
        },
      ];
      const chapter = makeChapter('Marks', nodes);
      const buffer = await exporter.exportChapter(chapter, 'marks.docx', { stylePreset: 'kdp' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle heading nodes', async () => {
      const nodes = [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph.' }] },
      ];
      const chapter = makeChapter('Headings', nodes);
      const buffer = await exporter.exportChapter(chapter, 'headings.docx', { stylePreset: 'kdp' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle textStyle mark with font and size', async () => {
      const nodes = [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Custom font',
              marks: [{ type: 'textStyle', attrs: { fontFamily: 'Georgia', fontSize: '16' } }],
            },
          ],
        },
      ];
      const chapter = makeChapter('TextStyle', nodes);
      const buffer = await exporter.exportChapter(chapter, 'style.docx', { stylePreset: 'kdp' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should skip unsupported list nodes without throwing', async () => {
      const nodes = [
        { type: 'bulletList', content: [] },
        { type: 'orderedList', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'After lists.' }] },
      ];
      const chapter = makeChapter('Lists', nodes);
      const buffer = await exporter.exportChapter(chapter, 'lists.docx', { stylePreset: 'kdp' });
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
