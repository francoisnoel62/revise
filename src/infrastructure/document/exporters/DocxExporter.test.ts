// ABOUTME: Unit test suite for DocxExporter validating .docx file generation
// ABOUTME: Tests document creation, paragraph handling, format validation, and style presets

import { describe, it, expect, beforeEach } from 'vitest';
import mammoth from 'mammoth';
import { DocxExporter } from './DocxExporter';
import { Chapter } from '@/domain/entities/Chapter';
import { FrontMatterData } from '@/domain/interfaces/DocumentExporter';

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

  describe('KDP — table of contents (bookmark + hyperlink)', () => {
    const nodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text.' }] }];

    it('each chapter title appears twice in KDP export (TOC entry + chapter heading)', async () => {
      const chapters = [
        makeChapter('Chapter One', nodes, 'ch-1'),
        makeChapter('Chapter Two', nodes, 'ch-2'),
      ];
      const buffer = await exporter.exportChapters(chapters, 'book.docx', { stylePreset: 'kdp' });
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect((html.match(/Chapter One/g) ?? []).length).toBe(2);
      expect((html.match(/Chapter Two/g) ?? []).length).toBe(2);
    });

    it('neutral preset does not add a TOC (each title appears once)', async () => {
      const chapters = [makeChapter('Chapter One', nodes, 'ch-1')];
      const buffer = await exporter.exportChapters(chapters, 'book.docx', { stylePreset: 'neutral' });
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect((html.match(/Chapter One/g) ?? []).length).toBe(1);
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

  describe('KDP — front matter pages', () => {
    const bodyNodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text.' }] }];

    const dedicationTipTap = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'À ma mère.' }] }],
    });

    const epigraphTipTap = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '"La vie est un roman."' }] },
      ],
    });

    const copyrightTipTap = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '© 2025 Jane Doe.' }] }],
    });

    it('generates valid buffer with complete frontMatter', async () => {
      const frontMatter: FrontMatterData = {
        title: 'Mon Roman',
        subtitle: 'Un sous-titre',
        authorName: 'Jane Doe',
        isbn: '978-0-000000-00-0',
        dedicationContent: dedicationTipTap,
        copyrightContent: copyrightTipTap,
        epigraphContent: epigraphTipTap,
        copyrightYear: 2025,
      };
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'kdp',
        frontMatter,
      });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });

    it('title and author appear in the generated document', async () => {
      const frontMatter: FrontMatterData = {
        title: 'Mon Roman',
        authorName: 'Jane Doe',
      };
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'kdp',
        frontMatter,
      });
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).toContain('Mon Roman');
      expect(html).toContain('Jane Doe');
    });

    it('without dedicationContent no crash and title still present', async () => {
      const frontMatter: FrontMatterData = { title: 'Mon Roman' };
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'kdp',
        frontMatter,
      });
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).toContain('Mon Roman');
    });

    it('generates copyright placeholder when copyrightContent is absent', async () => {
      const frontMatter: FrontMatterData = {
        title: 'Mon Roman',
        authorName: 'Jane Doe',
        copyrightYear: 2025,
      };
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'kdp',
        frontMatter,
      });
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).toContain('© 2025 Jane Doe');
    });

    it('without frontMatter the export behaves as before (no crash)', async () => {
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'kdp',
      });
      expect(buffer).toBeInstanceOf(Buffer);
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).toContain('Chapitre 1');
    });

    it('frontMatter is ignored for neutral preset', async () => {
      const frontMatter: FrontMatterData = { title: 'Mon Roman', authorName: 'Jane Doe' };
      const chapter = makeChapter('Chapitre 1', bodyNodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx', {
        stylePreset: 'neutral',
        frontMatter,
      });
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
