// ABOUTME: Tests for extracting endnotes from a chapter's TipTap JSON in document order.
// ABOUTME: Guards the numbering and body payload that both the paged and DOCX exports rely on.

import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import {
  extractChapterEndnotes,
  endnoteCallId,
  endnoteNoteId,
} from '../endnoteCompilation';

function note(text: string): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

describe('extractChapterEndnotes', () => {
  it('returns an empty list when the chapter has no endnotes', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sans note.' }] }],
    };
    expect(extractChapterEndnotes(doc)).toEqual([]);
  });

  it('collects endnote calls in document order, numbered from 1', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Premier' },
            { type: 'endnoteRef', attrs: { content: note('Note un') } },
            { type: 'text', text: ' puis' },
            { type: 'endnoteRef', attrs: { content: note('Note deux') } },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Ensuite' },
            { type: 'endnoteRef', attrs: { content: note('Note trois') } },
          ],
        },
      ],
    };

    const notes = extractChapterEndnotes(doc);

    expect(notes.map((n) => n.number)).toEqual([1, 2, 3]);
    expect(notes.map((n) => n.content)).toEqual([note('Note un'), note('Note deux'), note('Note trois')]);
  });

  it('numbering restarts at 1 for each chapter (a call is per-document positional)', () => {
    const chapterTwo: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'endnoteRef', attrs: { content: note('Seule note du chapitre 2') } }],
        },
      ],
    };
    expect(extractChapterEndnotes(chapterTwo).map((n) => n.number)).toEqual([1]);
  });

  it('treats a missing content attr as an empty note (null)', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'endnoteRef' }] }],
    };
    expect(extractChapterEndnotes(doc)).toEqual([{ number: 1, content: null }]);
  });

  it('finds calls nested inside blockquotes and list items', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'endnoteRef', attrs: { content: note('Dans une citation') } }],
            },
          ],
        },
      ],
    };
    expect(extractChapterEndnotes(doc).map((n) => n.number)).toEqual([1]);
  });
});

describe('endnote anchor ids', () => {
  it('derives matching call and note ids from a prefix and number', () => {
    expect(endnoteCallId('chapter-abc', 2)).toBe('endnote-call-chapter-abc-2');
    expect(endnoteNoteId('chapter-abc', 2)).toBe('endnote-note-chapter-abc-2');
  });
});
