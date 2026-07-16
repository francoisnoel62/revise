// ABOUTME: Tests for TipTapToBookHtml — verifies TipTap JSON converts to semantic HTML for the book renderer.
// ABOUTME: Only the structural/semantic output matters; presentation is the profile's responsibility.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import type { JSONContent } from '@tiptap/core';

const converter = new TipTapToBookHtml();
const NBSP = String.fromCharCode(0xa0);

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

    it('inserts French non-breaking spaces before high punctuation so it cannot orphan', () => {
      // Author types regular spaces; the renderer makes them non-breaking (U+00A0).
      const html = converter.convert(doc(paragraph('Vraiment ? « Oui »')));
      expect(html).toContain(`Vraiment${NBSP}?`);
      expect(html).toContain(`«${NBSP}Oui${NBSP}»`);
      expect(html).not.toContain('Vraiment ?');
    });
  });

  describe('convert — title fidelity (no injection, no fallback)', () => {
    it('renders the semantic titre-de-chapitre heading exactly as authored in the body', () => {
      const content = doc(
        { ...heading(1, 'Chapitre Un'), attrs: { level: 1, semanticRole: 'titre-de-chapitre' } },
        paragraph('Corps du chapitre.')
      );
      const html = converter.convert(content);
      expect(html).toMatch(/<h1[^>]*data-semantic-role="titre-de-chapitre"[^>]*>Chapitre Un<\/h1>/);
    });

    it('renders no heading at all when the chapter body has none (no fallback title)', () => {
      const content = doc(paragraph('Corps sans titre.'));
      const html = converter.convert(content);
      expect(html).not.toMatch(/<h1/);
    });
  });

  // A blank line an author leaves after a titre-de-chapitre/sous-titre (pressing Enter for
  // visual spacing) becomes an empty <p></p> — Paged.js's break-after: avoid glues the
  // heading to whatever element comes right after it in the DOM, so that empty paragraph
  // steals the glue meant for the real body paragraph, and the heading can strand alone at
  // the bottom of a page. Dropping the blank paragraph keeps the heading adjacent to real content.
  describe('convert — blank lines after headings do not defeat break-after: avoid', () => {
    function glued(role: string, text: string): JSONContent {
      return { ...heading(1, text), attrs: { level: 1, semanticRole: role } };
    }

    function blankParagraph(): JSONContent {
      return { type: 'paragraph' };
    }

    it('drops a blank paragraph immediately following a titre-de-chapitre', () => {
      const content = doc(glued('titre-de-chapitre', 'Chapitre Un'), blankParagraph(), paragraph('Corps.'));
      const html = converter.convert(content);
      expect(html).not.toMatch(/<p[^>]*><\/p>/);
      expect(html).toMatch(/<\/h1><p[^>]*>Corps\.<\/p>/);
    });

    it('drops a blank paragraph immediately following a sous-titre', () => {
      const content = doc(glued('sous-titre', 'Un sous-titre'), blankParagraph(), paragraph('Corps.'));
      const html = converter.convert(content);
      expect(html).not.toMatch(/<p[^>]*><\/p>/);
      expect(html).toMatch(/<\/h1><p[^>]*>Corps\.<\/p>/);
    });

    it('drops several consecutive blank paragraphs after a heading', () => {
      const content = doc(glued('sous-titre', 'Un sous-titre'), blankParagraph(), blankParagraph(), paragraph('Corps.'));
      const html = converter.convert(content);
      expect(html).not.toMatch(/<p[^>]*><\/p>/);
      expect(html).toMatch(/<\/h1><p[^>]*>Corps\.<\/p>/);
    });

    it('keeps a blank paragraph that is not adjacent to a glued heading', () => {
      const content = doc(paragraph('Premier.'), blankParagraph(), paragraph('Deuxième.'));
      const html = converter.convert(content);
      expect(html).toMatch(/<p[^>]*><\/p>/);
    });

    it('keeps a heading not marked titre-de-chapitre/sous-titre followed by a blank paragraph unchanged', () => {
      const content = doc(heading(2, 'Simple titre'), blankParagraph(), paragraph('Corps.'));
      const html = converter.convert(content);
      expect(html).toMatch(/<p[^>]*><\/p>/);
    });

    it('leaves a heading directly followed by a real paragraph unchanged (no blank line present)', () => {
      const content = doc(glued('titre-de-chapitre', 'Chapitre Un'), paragraph('Corps.'));
      const html = converter.convert(content);
      expect(html).toMatch(/<\/h1><p[^>]*>Corps\.<\/p>/);
    });
  });

  describe('convert — id attribute passthrough (anchors for TOC sub-entries)', () => {
    it('renders the id attribute when node.attrs.id is set', () => {
      const content = doc({
        ...heading(2, 'Un sous-titre'),
        attrs: { level: 2, semanticRole: 'sous-titre', id: 'chapter-ch1-soustitre-0' },
      });
      const html = converter.convert(content);
      expect(html).toMatch(/<h2[^>]*id="chapter-ch1-soustitre-0"[^>]*>Un sous-titre<\/h2>/);
    });

    it('omits the id attribute when node.attrs.id is absent (unchanged default behavior)', () => {
      const html = converter.convert(doc(heading(1, 'Chapitre I')));
      expect(html).not.toContain('id=');
    });
  });

  describe('convert — data-word-anchor attribute passthrough (scroll sync)', () => {
    it('renders the data-word-anchor attribute when node.attrs.wordAnchor is set', () => {
      const content = doc({ ...paragraph('Mille mots plus loin.'), attrs: { wordAnchor: 1 } });
      const html = converter.convert(content);
      expect(html).toMatch(/<p[^>]*data-word-anchor="1"[^>]*>Mille mots plus loin\.<\/p>/);
    });

    it('omits the data-word-anchor attribute when node.attrs.wordAnchor is absent', () => {
      const html = converter.convert(doc(paragraph('Corps.')));
      expect(html).not.toContain('data-word-anchor');
    });
  });
});
