// ABOUTME: Tests for buildEndnoteIndex — groups a project's endnotes by chapter, numbered as at export.
// ABOUTME: Locks the (chapter, rank) addressing the endnotes manager panel relies on.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { buildEndnoteIndex } from './endnoteIndex';

const ENDNOTE_REF_NAME = 'endnoteRef';

const noteBody = (text: string): JSONContent | null => {
  if (text === '') return null;
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
};

const blankNoteBody: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

const paragraphWithNote = (text: string, noteText: string): JSONContent => ({
  type: 'paragraph',
  content: [
    { type: 'text', text },
    { type: ENDNOTE_REF_NAME, attrs: { content: noteBody(noteText) } },
  ],
});

const chapterContent = (blocks: JSONContent[]): string =>
  JSON.stringify({ type: 'doc', content: blocks });

const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('buildEndnoteIndex', () => {
  it('groups notes by chapter, numbered from 1 in each chapter', () => {
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre 1',
        content: chapterContent([
          paragraphWithNote('Premier ', 'note a'),
          paragraphWithNote('Second ', 'note b'),
        ]),
      },
      {
        id: 'ch2',
        title: 'Chapitre 2',
        content: chapterContent([paragraphWithNote('Autre ', 'note c')]),
      },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index).toEqual([
      {
        chapterId: 'ch1',
        chapterTitle: 'Chapitre 1',
        notes: [
          { rank: 1, text: 'note a', preview: 'note a', isEmpty: false },
          { rank: 2, text: 'note b', preview: 'note b', isEmpty: false },
        ],
      },
      {
        chapterId: 'ch2',
        chapterTitle: 'Chapitre 2',
        notes: [{ rank: 1, text: 'note c', preview: 'note c', isEmpty: false }],
      },
    ]);
  });

  it('renders an empty list when the project has no note at all', () => {
    const chapters = [{ id: 'ch1', title: 'Chapitre 1', content: chapterContent([paragraph('Rien ici.')]) }];

    expect(buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null })).toEqual([]);
  });

  it('omits chapters that carry no note', () => {
    const chapters = [
      { id: 'ch1', title: 'Sans note', content: chapterContent([paragraph('Rien.')]) },
      { id: 'ch2', title: 'Avec note', content: chapterContent([paragraphWithNote('Une ', 'note')]) },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index.map((c) => c.chapterId)).toEqual(['ch2']);
  });

  it('preserves the project chapter order', () => {
    const chapters = [
      { id: 'ch3', title: 'Trois', content: chapterContent([paragraphWithNote('c ', 'trois')]) },
      { id: 'ch1', title: 'Un', content: chapterContent([paragraphWithNote('a ', 'un')]) },
      { id: 'ch2', title: 'Deux', content: chapterContent([paragraphWithNote('b ', 'deux')]) },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index.map((c) => c.chapterId)).toEqual(['ch3', 'ch1', 'ch2']);
  });

  it('prefers the in-progress activeContent over the stored content for the active chapter', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre 1', content: chapterContent([paragraph('Rien de sauvegardé.')]) },
    ];
    const activeContent = chapterContent([paragraphWithNote('Frappé mais pas sauvegardé ', 'note en cours')]);

    const index = buildEndnoteIndex({ chapters, activeChapterId: 'ch1', activeContent });

    expect(index).toEqual([
      {
        chapterId: 'ch1',
        chapterTitle: 'Chapitre 1',
        notes: [{ rank: 1, text: 'note en cours', preview: 'note en cours', isEmpty: false }],
      },
    ]);
  });

  it('ignores activeContent when activeChapterId is null', () => {
    const chapters = [{ id: 'ch1', title: 'Chapitre 1', content: chapterContent([paragraph('Stocké.')]) }];
    const activeContent = chapterContent([paragraphWithNote('Ignoré ', 'note ignorée')]);

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent });

    expect(index).toEqual([]);
  });

  it('renders an empty list, without throwing, when a chapter content is unreadable', () => {
    const chapters = [{ id: 'ch1', title: 'Chapitre 1', content: '{not json' }];

    expect(() =>
      buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null })
    ).not.toThrow();
    expect(buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null })).toEqual([]);
  });

  it('normalizes text across marked runs without doubling spaces around a bold passage', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Un mot ' },
            { type: 'text', text: 'important', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' puis la suite.' },
          ],
        },
      ],
    };
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre 1',
        content: chapterContent([
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Texte ' },
              { type: ENDNOTE_REF_NAME, attrs: { content } },
            ],
          },
        ]),
      },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index[0].notes[0].text).toBe('Un mot important puis la suite.');
  });

  it('truncates the preview to a bounded length with a continuation character, keeping the full text', () => {
    const longText = Array.from({ length: 30 }, (_, i) => `mot${i}`).join(' ');
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre 1',
        content: chapterContent([paragraphWithNote('Texte ', longText)]),
      },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null, previewLength: 20 });

    const note = index[0].notes[0];
    expect(note.text).toBe(longText);
    expect(note.preview.length).toBeLessThanOrEqual(21);
    expect(note.preview.endsWith('…')).toBe(true);
    expect(longText.length).toBeGreaterThan(20);
  });

  it('does not truncate a preview shorter than the bound', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre 1', content: chapterContent([paragraphWithNote('Texte ', 'court')]) },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index[0].notes[0].preview).toBe('court');
  });

  it('marks a note with no body at all as empty', () => {
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre 1',
        content: chapterContent([
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Texte ' },
              { type: ENDNOTE_REF_NAME, attrs: { content: null } },
            ],
          },
        ]),
      },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index[0].notes[0]).toEqual({ rank: 1, text: '', preview: '', isEmpty: true });
  });

  it('marks a note with an entirely blank body as empty', () => {
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre 1',
        content: chapterContent([
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Texte ' },
              { type: ENDNOTE_REF_NAME, attrs: { content: blankNoteBody } },
            ],
          },
        ]),
      },
    ];

    const index = buildEndnoteIndex({ chapters, activeChapterId: null, activeContent: null });

    expect(index[0].notes[0].isEmpty).toBe(true);
  });
});
