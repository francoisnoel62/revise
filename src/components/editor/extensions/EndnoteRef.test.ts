// ABOUTME: Tests for the EndnoteRef inline node — insertion, numbering, anchoring, deletion.
// ABOUTME: Numbering is positional (per-chapter reset is free: each chapter is its own doc).

import { describe, it, expect } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import { extractChapterEndnotes } from '@/application/rendering/endnoteCompilation';
import { switchPublicationProfile } from '@/application/rendering/PublicationProfileSwitch';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import {
  EndnoteRef,
  ENDNOTE_REF_NAME,
  collectEndnoteRefs,
  isEndnoteContentEmpty,
  findDeletableEndnoteRef,
  findEndnoteRefByRank,
  type EndnoteContent,
} from './EndnoteRef';

// A note body is a TipTap doc fragment (one paragraph of rich inline text).
const makeNote = (text: string): EndnoteContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
});

const emptyNote: EndnoteContent = { type: 'doc', content: [{ type: 'paragraph' }] };

const createEditor = (content = '<p>Hello world</p>') =>
  new Editor({
    extensions: [Document, Paragraph, Text, Bold, EndnoteRef],
    content,
  });

describe('EndnoteRef — node basics', () => {
  it('is defined', () => {
    expect(EndnoteRef).toBeDefined();
    expect(ENDNOTE_REF_NAME).toBe('endnoteRef');
  });

  it('is an inline atom node', () => {
    const editor = createEditor();
    const spec = editor.schema.nodes[ENDNOTE_REF_NAME];
    expect(spec).toBeDefined();
    expect(spec.isInline).toBe(true);
    expect(spec.isAtom).toBe(true);
    editor.destroy();
  });

  it('inserts an endnote call at the cursor', () => {
    const editor = createEditor('<p>Hello world</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('a note')).run();

    const entries = collectEndnoteRefs(editor.state.doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toEqual(makeNote('a note'));
    editor.destroy();
  });
});

describe('EndnoteRef — content storage & persistence', () => {
  it('preserves note content through a JSON round-trip', () => {
    const editor = createEditor('<p>Hello world</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('persist me')).run();

    const json = JSON.stringify(editor.getJSON());

    const reloaded = createEditor('<p></p>');
    reloaded.commands.setContent(JSON.parse(json));
    const entries = collectEndnoteRefs(reloaded.state.doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toEqual(makeNote('persist me'));
    editor.destroy();
    reloaded.destroy();
  });

  it('preserves note content through an HTML round-trip', () => {
    const editor = createEditor('<p>Hello world</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('html me')).run();

    const html = editor.getHTML();
    expect(html).toContain('data-endnote');

    const reloaded = createEditor(html);
    const entries = collectEndnoteRefs(reloaded.state.doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toEqual(makeNote('html me'));
    editor.destroy();
    reloaded.destroy();
  });

  it('never renders the note body inline as text', () => {
    const editor = createEditor('<p>Visible text</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('secret footnote body')).run();

    expect(editor.getText()).not.toContain('secret footnote body');
    expect(editor.getText()).toContain('Visible text');
    editor.destroy();
  });
});

describe('EndnoteRef — numbering', () => {
  it('numbers notes 1..N in document order', () => {
    const editor = createEditor('<p>One two three</p>');
    // Insert at the end first, then at the start, to prove numbering is positional
    // (document order), not insertion order.
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.chain().focus().insertEndnote(makeNote('later')).run();
    editor.commands.setTextSelection(1);
    editor.chain().focus().insertEndnote(makeNote('earlier')).run();

    const entries = collectEndnoteRefs(editor.state.doc);
    expect(entries.map((e) => e.number)).toEqual([1, 2]);
    expect(entries[0].content).toEqual(makeNote('earlier'));
    expect(entries[1].content).toEqual(makeNote('later'));
    editor.destroy();
  });

  it('resets numbering per document (chapter)', () => {
    const chapterA = createEditor('<p>A</p>');
    chapterA.commands.setTextSelection(1);
    chapterA.chain().focus().insertEndnote(makeNote('a1')).run();

    const chapterB = createEditor('<p>B</p>');
    chapterB.commands.setTextSelection(1);
    chapterB.chain().focus().insertEndnote(makeNote('b1')).run();

    expect(collectEndnoteRefs(chapterA.state.doc)[0].number).toBe(1);
    expect(collectEndnoteRefs(chapterB.state.doc)[0].number).toBe(1);
    chapterA.destroy();
    chapterB.destroy();
  });

  it('renumbers automatically after a note is deleted', () => {
    const editor = createEditor('<p>First</p><p>Second</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('n1')).run();
    // Position inside the second paragraph, after the shift from the first insert.
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.chain().focus().insertEndnote(makeNote('n2')).run();

    let entries = collectEndnoteRefs(editor.state.doc);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.number)).toEqual([1, 2]);

    // Delete the first note; the second must become number 1.
    editor.chain().focus().deleteEndnote(entries[0].pos).run();

    entries = collectEndnoteRefs(editor.state.doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].number).toBe(1);
    expect(entries[0].content).toEqual(makeNote('n2'));
    editor.destroy();
  });
});

describe('EndnoteRef — anchoring (insécable)', () => {
  it('carries the note and its body when the text is cut and pasted elsewhere', () => {
    const editor = createEditor('<p>Hello</p><p>Target</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('sticky note')).run();

    // Cut the atom call node out of the first paragraph...
    const { pos } = collectEndnoteRefs(editor.state.doc)[0];
    const slice = editor.state.doc.slice(pos, pos + 1);
    editor.chain().deleteRange({ from: pos, to: pos + 1 }).run();
    expect(collectEndnoteRefs(editor.state.doc)).toHaveLength(0);

    // ...and paste it into the second paragraph. The note must arrive intact.
    const targetPos = editor.state.doc.content.size - 1;
    editor.chain().insertContentAt(targetPos, slice.content.toJSON()).run();

    const entries = collectEndnoteRefs(editor.state.doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toEqual(makeNote('sticky note'));
    editor.destroy();
  });

  it('cannot place the cursor inside the call (it is a single atomic unit)', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('atom')).run();

    const node = editor.schema.nodes[ENDNOTE_REF_NAME];
    // An atom leaf has no editable inner content — nothing can split it.
    expect(node.isAtom).toBe(true);
    expect(node.isLeaf).toBe(true);
    editor.destroy();
  });
});

describe('EndnoteRef — editing & deletion commands', () => {
  it('updates the content of an existing note', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('old')).run();

    const { pos } = collectEndnoteRefs(editor.state.doc)[0];
    editor.chain().focus().updateEndnote(pos, makeNote('new')).run();

    const entries = collectEndnoteRefs(editor.state.doc);
    expect(entries[0].content).toEqual(makeNote('new'));
    editor.destroy();
  });

  it('deletes a note by position', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('bye')).run();

    const { pos } = collectEndnoteRefs(editor.state.doc)[0];
    editor.chain().focus().deleteEndnote(pos).run();

    expect(collectEndnoteRefs(editor.state.doc)).toHaveLength(0);
    editor.destroy();
  });
});

describe('isEndnoteContentEmpty', () => {
  it('treats null/undefined as empty', () => {
    expect(isEndnoteContentEmpty(null)).toBe(true);
    expect(isEndnoteContentEmpty(undefined)).toBe(true);
  });

  it('treats an empty paragraph as empty', () => {
    expect(isEndnoteContentEmpty(emptyNote)).toBe(true);
  });

  it('treats whitespace-only text as empty', () => {
    expect(isEndnoteContentEmpty(makeNote('   '))).toBe(true);
  });

  it('treats text content as non-empty', () => {
    expect(isEndnoteContentEmpty(makeNote('real content'))).toBe(false);
  });
});

describe('findDeletableEndnoteRef', () => {
  it('finds the note immediately before the cursor (Backspace)', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('boom')).run();
    // Cursor now sits right after the inserted note.
    const found = findDeletableEndnoteRef(editor.state, 'before');
    expect(found).not.toBeNull();
    expect(found?.content).toEqual(makeNote('boom'));
    editor.destroy();
  });

  it('finds the note immediately after the cursor (Delete)', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('boom')).run();
    // Move the cursor back to just before the note.
    const { pos } = collectEndnoteRefs(editor.state.doc)[0];
    editor.commands.setTextSelection(pos);
    const found = findDeletableEndnoteRef(editor.state, 'after');
    expect(found).not.toBeNull();
    expect(found?.content).toEqual(makeNote('boom'));
    editor.destroy();
  });

  it('returns null when no note is adjacent', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    expect(findDeletableEndnoteRef(editor.state, 'before')).toBeNull();
    expect(findDeletableEndnoteRef(editor.state, 'after')).toBeNull();
    editor.destroy();
  });
});

describe('findEndnoteRefByRank', () => {
  it('resolves the pos and content of the note at the given 1-based rank', () => {
    const editor = createEditor('<p>First</p><p>Second</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('n1')).run();
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.chain().focus().insertEndnote(makeNote('n2')).run();

    const entries = collectEndnoteRefs(editor.state.doc);
    const found = findEndnoteRefByRank(editor.state.doc, 2);

    expect(found).toEqual({ pos: entries[1].pos, content: makeNote('n2') });
    editor.destroy();
  });

  it('returns null when the rank does not exist in the document', () => {
    const editor = createEditor('<p>Hello</p>');
    editor.commands.setTextSelection(3);
    editor.chain().focus().insertEndnote(makeNote('only one')).run();

    expect(findEndnoteRefByRank(editor.state.doc, 2)).toBeNull();
    expect(findEndnoteRefByRank(editor.state.doc, 0)).toBeNull();
    editor.destroy();
  });
});

// Invariant the endnote panel (docs/plans/footnotes-manager-panel) is built on: a note is
// addressed by (chapter, rank) rather than by document position, which only works if the two
// independent traversals below always agree on order and count.
describe('EndnoteRef — parity with extractChapterEndnotes', () => {
  const createFixtureEditor = () =>
    new Editor({
      extensions: [Document, Paragraph, Text, Bold, Blockquote, BulletList, ListItem, Heading, EndnoteRef],
      content: fixtureDoc,
    });

  it('collectEndnoteRefs (PMNode) and extractChapterEndnotes (JSON) agree on order and count', () => {
    const editor = createFixtureEditor();

    const fromPMNode = collectEndnoteRefs(editor.state.doc);
    const fromJSON = extractChapterEndnotes(editor.getJSON() as JSONContent);

    expect(fromPMNode).toHaveLength(5);
    expect(fromJSON).toHaveLength(5);
    expect(fromPMNode.map((e) => e.content)).toEqual(fromJSON.map((e) => e.content));
    editor.destroy();
  });

  it('still agree after the content passes through the passerelle gateway (semantic → overrides applied)', () => {
    const editor = createFixtureEditor();
    const semantic = editor.getJSON() as ContentNode;

    // An override that only touches presentation attrs must never insert or remove a node —
    // if it ever did, the endnote count/order below would silently drift.
    const { content: presented } = switchPublicationProfile(
      semantic,
      'passerelle',
      [{ nodeIndex: 1, props: { fontSize: '14pt' } }]
    );

    const presentedEditor = new Editor({
      extensions: [Document, Paragraph, Text, Bold, Blockquote, BulletList, ListItem, Heading, EndnoteRef],
      content: presented as JSONContent,
    });

    const fromPMNode = collectEndnoteRefs(presentedEditor.state.doc);
    const fromJSON = extractChapterEndnotes(presented as JSONContent);

    expect(fromPMNode).toHaveLength(5);
    expect(fromJSON).toHaveLength(5);
    expect(fromPMNode.map((e) => e.content)).toEqual(fromJSON.map((e) => e.content));
    editor.destroy();
    presentedEditor.destroy();
  });
});

function noteBody(text: string): EndnoteContent | null {
  if (text === '') return null; // an empty note: no meaningful body at all
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

// Covers every block kind the plan's invariant must survive: heading, paragraph, blockquote,
// list item, plus one note with no body (`content: null`) to prove emptiness doesn't skip a slot.
const fixtureDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        { type: 'text', text: 'Titre ' },
        { type: ENDNOTE_REF_NAME, attrs: { content: noteBody('note de titre') } },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Un paragraphe ' },
        { type: ENDNOTE_REF_NAME, attrs: { content: noteBody('note de paragraphe') } },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Une citation ' },
            { type: ENDNOTE_REF_NAME, attrs: { content: noteBody('note de citation') } },
          ],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: "Un élément de liste " },
                { type: ENDNOTE_REF_NAME, attrs: { content: noteBody('note de liste') } },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Une dernière note, vide ' },
        { type: ENDNOTE_REF_NAME, attrs: { content: noteBody('') } },
      ],
    },
  ],
};
