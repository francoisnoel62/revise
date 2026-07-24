// ABOUTME: Tests for the EndnoteRef inline node — insertion, numbering, anchoring, deletion.
// ABOUTME: Numbering is positional (per-chapter reset is free: each chapter is its own doc).

import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import {
  EndnoteRef,
  ENDNOTE_REF_NAME,
  collectEndnoteRefs,
  isEndnoteContentEmpty,
  findDeletableEndnoteRef,
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
