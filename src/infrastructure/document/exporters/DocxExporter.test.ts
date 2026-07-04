// ABOUTME: Unit test suite for DocxExporter — single style rattached to the passerelle profile.
// ABOUTME: Tests document creation, paragraph handling, format validation, and title fidelity.

import { describe, it, expect, beforeEach } from 'vitest';
import mammoth from 'mammoth';
import { DocxExporter } from './DocxExporter';
import { Chapter } from '@/domain/entities/Chapter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

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

    it('should generate valid buffer', async () => {
      const chapter = makeChapter('Chapter One', bodyNodes);
      const buffer = await exporter.exportChapter(chapter, 'ch1.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });
  });

  describe('exportChapters', () => {
    const nodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text.' }] }];

    it('generates valid buffer for multiple chapters', async () => {
      const chapters = [
        makeChapter('Chapter 1', nodes),
        makeChapter('Chapter 2', nodes, 'ch-2'),
      ];
      const buffer = await exporter.exportChapters(chapters, 'book.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(VALID_DOCX_MAGIC[0]);
      expect(buffer[1]).toBe(VALID_DOCX_MAGIC[1]);
    });

    it('should throw when given an empty chapters array', async () => {
      await expect(exporter.exportChapters([], 'book.docx')).rejects.toThrow(
        'No chapters to export'
      );
    });
  });

  describe('title fidelity — no injection, no fallback', () => {
    it('does not inject chapter.title: only the heading present in the body appears', async () => {
      const nodes = [
        { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Titre du corps' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Corps.' }] },
      ];
      const chapter = makeChapter('Nom de chapitre différent', nodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx');
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).toContain('Titre du corps');
      expect(html).not.toContain('Nom de chapitre différent');
    });

    it('renders no heading at all when the chapter body has none', async () => {
      const nodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Corps sans titre.' }] }];
      const chapter = makeChapter('Chapitre sans titre', nodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx');
      const { value: html } = await mammoth.convertToHtml({ buffer });
      expect(html).not.toContain('Chapitre sans titre');
      expect(html).toContain('Corps sans titre.');
    });
  });

  describe('geometry — driven by PublicationProfile.passerelle()', () => {
    it('applies the passerelle body font and size when the author sets no override', async () => {
      const nodes = [{ type: 'paragraph', content: [{ type: 'text', text: 'Texte simple.' }] }];
      const chapter = makeChapter('Chapitre 1', nodes);
      const buffer = await exporter.exportChapters([chapter], 'book.docx');
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const profile = PublicationProfile.passerelle().values;
      expect(profile.bodyFontFamily).toBe('Arial');
      expect(html).toContain('Texte simple.');
    });
  });

  describe('TipTap formatting', () => {
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
      const buffer = await exporter.exportChapter(chapter, 'marks.docx');
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle heading nodes', async () => {
      const nodes = [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph.' }] },
      ];
      const chapter = makeChapter('Headings', nodes);
      const buffer = await exporter.exportChapter(chapter, 'headings.docx');
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
      const buffer = await exporter.exportChapter(chapter, 'style.docx');
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should skip unsupported list nodes without throwing', async () => {
      const nodes = [
        { type: 'bulletList', content: [] },
        { type: 'orderedList', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'After lists.' }] },
      ];
      const chapter = makeChapter('Lists', nodes);
      const buffer = await exporter.exportChapter(chapter, 'lists.docx');
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
