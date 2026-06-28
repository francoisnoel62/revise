// ABOUTME: Tests for TipTapToBookHtml — verifies TipTap JSON converts to semantic HTML for the book renderer.
// ABOUTME: Only the structural/semantic output matters; presentation is the profile's responsibility.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import type { JSONContent } from '@tiptap/core';

const converter = new TipTapToBookHtml();

function doc(...children: JSONContent[]): JSONContent {
  return { type: 'doc', content: children };
}

function paragraph(text: string): JSONContent {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function heading(level: number, text: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

describe('TipTapToBookHtml', () => {
  describe('convert', () => {
    it('converts a paragraph to <p>', () => {
      const html = converter.convert(doc(paragraph('Bonjour le monde.')));
      expect(html).toMatch(/<p[^>]*>Bonjour le monde\.<\/p>/);
    });

    it('converts a chapter heading to <h1>', () => {
      const html = converter.convert(doc(heading(1, 'Chapitre I')));
      expect(html).toMatch(/<h1[^>]*>Chapitre I<\/h1>/);
    });

    it('converts multiple paragraphs preserving order', () => {
      const html = converter.convert(doc(paragraph('Premier.'), paragraph('Deuxième.')));
      const firstIdx = html.indexOf('Premier.');
      const secondIdx = html.indexOf('Deuxième.');
      expect(firstIdx).toBeGreaterThanOrEqual(0);
      expect(secondIdx).toBeGreaterThan(firstIdx);
    });

    it('throws when content root is not a doc', () => {
      expect(() => converter.convert({ type: 'paragraph' })).toThrow(
        'Paged rendering requires a TipTap document root'
      );
    });

    it('returns valid HTML string for an empty document', () => {
      const html = converter.convert(doc());
      expect(typeof html).toBe('string');
    });
  });

  describe('convertChapter', () => {
    it('strips a leading heading that exactly matches the chapter title', () => {
      const content = doc(heading(1, 'Chapitre Un'), paragraph('Corps du chapitre.'));
      const html = converter.convertChapter(content, 'Chapitre Un');
      expect(html).not.toMatch(/<h1[^>]*>Chapitre Un<\/h1>/);
      expect(html).toMatch(/<p[^>]*>Corps du chapitre\.<\/p>/);
    });

    it('strips leading heading case-insensitively and ignoring surrounding whitespace', () => {
      const content = doc(heading(1, '  chapitre un  '), paragraph('Texte.'));
      const html = converter.convertChapter(content, 'Chapitre Un');
      expect(html).not.toMatch(/<h1/);
      expect(html).toMatch(/Texte\./);
    });

    it('keeps a leading heading that differs from the chapter title', () => {
      const content = doc(heading(2, 'Partie I'), paragraph('Texte.'));
      const html = converter.convertChapter(content, 'Chapitre Un');
      expect(html).toMatch(/<h2/);
    });

    it('keeps a non-heading leading node unchanged', () => {
      const content = doc(paragraph('Premier paragraphe.'), paragraph('Deuxième.'));
      const html = converter.convertChapter(content, 'Chapitre Un');
      expect(html).toMatch(/Premier paragraphe\./);
      expect(html).toMatch(/Deuxième\./);
    });

    it('handles an empty document without throwing', () => {
      const html = converter.convertChapter(doc(), 'Titre');
      expect(typeof html).toBe('string');
    });
  });
});
