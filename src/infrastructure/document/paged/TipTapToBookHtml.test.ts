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

  // A blank line the author leaves inside the body is intentional spacing. It must survive to
  // the page, so the paginated preview shows what the editor shows (ADR 0005). An empty <p>
  // generates no line box and collapses to zero height, so the converter marks it and
  // BookCssBuilder gives it a line's height.
  describe('convert — blank lines inside the body are preserved as visible spacing', () => {
    function blankParagraph(): JSONContent {
      return { type: 'paragraph' };
    }

    it('marks a blank paragraph between two paragraphs with data-blank-line', () => {
      const content = doc(paragraph('Premier.'), blankParagraph(), paragraph('Deuxième.'));
      const html = converter.convert(content);
      expect(html).toMatch(/<p[^>]*data-blank-line[^>]*><\/p>/);
    });

    it('marks a paragraph the author filled with whitespace only', () => {
      const content = doc(
        paragraph('Premier.'),
        { type: 'paragraph', content: [{ type: 'text', text: '   ' }] },
        paragraph('Deuxième.'),
      );
      const html = converter.convert(content);
      expect(html).toMatch(/data-blank-line/);
    });

    it('does not mark a paragraph that carries text', () => {
      const html = converter.convert(doc(paragraph('Du vrai texte.')));
      expect(html).not.toContain('data-blank-line');
    });

    it('preserves every blank line of a run — the author decides how much air the text gets', () => {
      const content = doc(
        paragraph('Premier.'),
        blankParagraph(),
        blankParagraph(),
        blankParagraph(),
        paragraph('Deuxième.'),
      );
      const html = converter.convert(content);
      expect(html.match(/data-blank-line/g)).toHaveLength(3);
    });

    it('keeps the semantic role of a blank paragraph so it inherits that level line-height', () => {
      const content = doc(
        paragraph('Premier.'),
        { type: 'paragraph', attrs: { semanticRole: 'corps' } },
        paragraph('Deuxième.'),
      );
      const html = converter.convert(content);
      expect(html).toMatch(/<p[^>]*data-semantic-role="corps"[^>]*data-blank-line[^>]*><\/p>/);
    });
  });

  // Trailing blank lines are an artefact of writing, not intentional spacing: they inflate the
  // chapter's height and can push an otherwise unnecessary page into the book.
  describe('convert — blank lines at the end of a document are dropped', () => {
    function blankParagraph(): JSONContent {
      return { type: 'paragraph' };
    }

    it('drops a single trailing blank paragraph', () => {
      const html = converter.convert(doc(paragraph('Fin du chapitre.'), blankParagraph()));
      expect(html).not.toContain('data-blank-line');
      expect(html).toMatch(/<p[^>]*>Fin du chapitre\.<\/p>$/);
    });

    it('drops several trailing blank paragraphs', () => {
      const html = converter.convert(
        doc(paragraph('Fin.'), blankParagraph(), blankParagraph(), blankParagraph()),
      );
      expect(html).not.toContain('data-blank-line');
    });

    it('keeps interior blank lines while dropping the trailing ones', () => {
      const html = converter.convert(
        doc(paragraph('Un.'), blankParagraph(), paragraph('Deux.'), blankParagraph()),
      );
      expect(html.match(/data-blank-line/g)).toHaveLength(1);
      expect(html).toMatch(/<p[^>]*>Deux\.<\/p>$/);
    });

    it('returns an empty string for a document made only of blank paragraphs', () => {
      const html = converter.convert(doc(blankParagraph(), blankParagraph()));
      expect(html).toBe('');
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

  describe('convert — endnote call (reading bubble)', () => {
    function endnote(inline: JSONContent[] | null): JSONContent {
      return {
        type: 'endnoteRef',
        attrs: {
          content: inline
            ? { type: 'doc', content: [{ type: 'paragraph', content: inline }] }
            : null,
        },
      };
    }

    function paragraphWith(...inline: JSONContent[]): JSONContent {
      return { type: 'paragraph', content: inline };
    }

    it('renders an endnote call as a superscript with the endnote-ref class', () => {
      const content = doc(paragraphWith({ type: 'text', text: 'Texte' }, endnote([{ type: 'text', text: 'La note.' }])));
      const html = converter.convert(content);
      expect(html).toMatch(/<sup[^>]*class="endnote-ref"/);
      expect(html).toContain('data-endnote');
    });

    it('carries the rich note body (bold / italic / link) in a hidden container', () => {
      const content = doc(
        paragraphWith(
          { type: 'text', text: 'Voir' },
          endnote([
            { type: 'text', text: 'gras', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'italique', marks: [{ type: 'italic' }] },
            { type: 'text', text: 'lien', marks: [{ type: 'link', attrs: { href: 'https://exemple.fr' } }] },
          ]),
        ),
      );
      const html = converter.convert(content);
      const bodyMatch = html.match(/<span class="endnote-body">([\s\S]*?)<\/span>/);
      expect(bodyMatch).not.toBeNull();
      const body = bodyMatch![1];
      expect(body).toContain('<strong>gras</strong>');
      expect(body).toContain('<em>italique</em>');
      expect(body).toContain('<a href="https://exemple.fr"');
      expect(body).toContain('lien</a>');
    });

    it('never renders a permanent notes block: the body text appears only inside the call', () => {
      const content = doc(
        paragraphWith({ type: 'text', text: 'Corps.' }, endnote([{ type: 'text', text: 'texte-unique-de-note' }])),
      );
      const html = converter.convert(content);
      expect(html.match(/texte-unique-de-note/g)).toHaveLength(1);
      expect(html).not.toContain('endnotes-section');
    });

    it('renders an empty call (no bubble content) when the note body is null', () => {
      const content = doc(paragraphWith({ type: 'text', text: 'Corps.' }, endnote(null)));
      const html = converter.convert(content);
      expect(html).toMatch(/<sup[^>]*class="endnote-ref"/);
      expect(html).toContain('<span class="endnote-body"></span>');
    });

    it('renders a call for each endnote in the document', () => {
      const content = doc(
        paragraphWith({ type: 'text', text: 'Un' }, endnote([{ type: 'text', text: 'A' }])),
        paragraphWith({ type: 'text', text: 'Deux' }, endnote([{ type: 'text', text: 'B' }])),
      );
      const html = converter.convert(content);
      expect(html.match(/class="endnote-ref"/g)).toHaveLength(2);
    });
  });

  describe('convert — endnote call (export round-trip anchoring)', () => {
    function endnote(text: string | null): JSONContent {
      return {
        type: 'endnoteRef',
        attrs: {
          content: text ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] } : null,
        },
      };
    }

    function paragraphWith(...inline: JSONContent[]): JSONContent {
      return { type: 'paragraph', content: inline };
    }

    it('wraps each call in an anchor linking to its compiled note, numbered per chapter', () => {
      const content = doc(
        paragraphWith({ type: 'text', text: 'Un' }, endnote('A')),
        paragraphWith({ type: 'text', text: 'Deux' }, endnote('B')),
      );
      const html = converter.convert(content, { endnoteAnchorPrefix: 'chapter-x' });

      // Call 1 carries an id (back-link target) and links to note 1.
      expect(html).toContain('id="endnote-call-chapter-x-1"');
      expect(html).toContain('href="#endnote-note-chapter-x-1"');
      // Call 2 links to note 2.
      expect(html).toContain('id="endnote-call-chapter-x-2"');
      expect(html).toContain('href="#endnote-note-chapter-x-2"');
      // The printed number is the literal per-chapter index.
      expect(html).toMatch(/<a[^>]*href="#endnote-note-chapter-x-1"[^>]*>1<\/a>/);
      expect(html).toMatch(/<a[^>]*href="#endnote-note-chapter-x-2"[^>]*>2<\/a>/);
    });

    it('marks anchored calls so CSS suppresses the counter (no double numbering)', () => {
      const content = doc(paragraphWith({ type: 'text', text: 'Un' }, endnote('A')));
      const html = converter.convert(content, { endnoteAnchorPrefix: 'chapter-x' });
      expect(html).toMatch(/<sup[^>]*class="endnote-ref endnote-ref--linked"/);
    });

    it('still carries the hidden bubble body when anchored', () => {
      const content = doc(paragraphWith({ type: 'text', text: 'Un' }, endnote('texte-de-note')));
      const html = converter.convert(content, { endnoteAnchorPrefix: 'chapter-x' });
      expect(html).toContain('<span class="endnote-body">texte-de-note</span>');
    });

    it('leaves calls unanchored when no prefix is given (reading view unchanged)', () => {
      const content = doc(paragraphWith({ type: 'text', text: 'Un' }, endnote('A')));
      const html = converter.convert(content);
      expect(html).not.toContain('endnote-ref--linked');
      expect(html).not.toContain('endnote-call-');
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
