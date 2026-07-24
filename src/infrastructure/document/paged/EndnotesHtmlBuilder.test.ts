// ABOUTME: Tests for compiling a book's endnotes into a back-matter section, grouped by chapter.
// ABOUTME: Covers per-chapter numbering restart, round-trip links, chapter headers, and the section title.

import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { EndnotesHtmlBuilder } from './EndnotesHtmlBuilder';
import { ENDNOTES_SECTION_ID } from '@/application/rendering/endnoteCompilation';
import { TipTapToBookHtml } from './TipTapToBookHtml';

function note(text: string, marks?: JSONContent['marks']): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text, ...(marks ? { marks } : {}) }] }] };
}

function chapterDoc(...notes: (JSONContent | null)[]): JSONContent {
  return {
    type: 'doc',
    content: notes.map((n) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Corps' }, { type: 'endnoteRef', attrs: { content: n } }],
    })),
  };
}

function build(chapters: Parameters<EndnotesHtmlBuilder['build']>[0], title?: string): string {
  return new EndnotesHtmlBuilder(new TipTapToBookHtml()).build(chapters, title);
}

describe('EndnotesHtmlBuilder', () => {
  it('returns an empty string when no chapter has any endnote', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'Chapitre premier', content: { type: 'doc', content: [] }, index: 1 },
    ]);
    expect(html).toBe('');
  });

  it('emits a notes section with the section id for the TOC target', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'Ouverture', content: chapterDoc(note('Une note')), index: 1 },
    ]);
    expect(html).toContain(`id="${ENDNOTES_SECTION_ID}"`);
    expect(html).toContain('class="back-matter endnotes"');
  });

  it('defaults the section title to « Notes »', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'Ouverture', content: chapterDoc(note('Une note')), index: 1 },
    ]);
    expect(html).toMatch(/<h2[^>]*class="endnotes-title"[^>]*>Notes<\/h2>/);
  });

  it('uses the author-provided section title when given', () => {
    const html = build(
      [{ anchorId: 'chapter-a', title: 'Ouverture', content: chapterDoc(note('Une note')), index: 1 }],
      'Notes de l’auteur',
    );
    expect(html).toMatch(/<h2[^>]*class="endnotes-title"[^>]*>Notes de l’auteur<\/h2>/);
    expect(html).not.toContain('>Notes<');
  });

  it('groups notes under their chapter title as a header', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'Le départ', content: chapterDoc(note('n1')), index: 1 },
      { anchorId: 'chapter-b', title: "L'arrivée", content: chapterDoc(note('n2')), index: 2 },
    ]);
    expect(html).toContain('<h3 class="endnotes-chapter-title">Le départ</h3>');
    expect(html).toContain("<h3 class=\"endnotes-chapter-title\">L&#039;arrivée</h3>");
  });

  it('falls back to « Chapitre N » when a chapter has no title', () => {
    const html = build([
      { anchorId: 'chapter-a', title: '', content: chapterDoc(note('n1')), index: 3 },
    ]);
    expect(html).toContain('<h3 class="endnotes-chapter-title">Chapitre 3</h3>');
  });

  it('restarts numbering at 1 for each chapter', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'A', content: chapterDoc(note('a1'), note('a2')), index: 1 },
      { anchorId: 'chapter-b', title: 'B', content: chapterDoc(note('b1')), index: 2 },
    ]);
    // Chapter A: notes numbered 1 and 2.
    expect(html).toContain('id="endnote-note-chapter-a-1"');
    expect(html).toContain('id="endnote-note-chapter-a-2"');
    // Chapter B restarts at 1.
    expect(html).toContain('id="endnote-note-chapter-b-1"');
    expect(html).not.toContain('endnote-note-chapter-b-2');
  });

  it('links each note back to its body call (round trip)', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'A', content: chapterDoc(note('a1')), index: 1 },
    ]);
    expect(html).toMatch(
      /<li[^>]*id="endnote-note-chapter-a-1"[^>]*>.*href="#endnote-call-chapter-a-1".*<\/li>/,
    );
  });

  it('renders the rich note body (bold / italic) inside the note', () => {
    const html = build([
      {
        anchorId: 'chapter-a',
        title: 'A',
        content: chapterDoc(note('gras', [{ type: 'bold' }])),
        index: 1,
      },
    ]);
    expect(html).toContain('<strong>gras</strong>');
  });

  it('skips chapters without notes but keeps those that have them', () => {
    const html = build([
      { anchorId: 'chapter-a', title: 'Vide', content: { type: 'doc', content: [] }, index: 1 },
      { anchorId: 'chapter-b', title: 'Avec note', content: chapterDoc(note('b1')), index: 2 },
    ]);
    expect(html).not.toContain('>Vide<');
    expect(html).toContain('>Avec note<');
  });
});
