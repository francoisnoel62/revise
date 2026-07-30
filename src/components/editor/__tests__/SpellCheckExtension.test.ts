// ABOUTME: Integration tests for the ProseMirror spell-check plugin state.
// ABOUTME: Verifies that spelling errors remain aligned with unedited manuscript text.

import { describe, expect, it } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import {
  createSpellCheckPlugin,
  spellCheckPluginKey,
  type SpellError,
} from '../SpellCheckExtension';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'text*', group: 'block' },
    text: { group: 'inline' },
  },
});

function createState(text: string) {
  return EditorState.create({
    schema,
    doc: schema.node('doc', null, [schema.node('paragraph', null, schema.text(text))]),
    plugins: [createSpellCheckPlugin()],
  });
}

function setErrors(state: EditorState, errors: SpellError[]) {
  return state.apply(state.tr.setMeta(spellCheckPluginKey, { errors }));
}

function getErrors(state: EditorState): SpellError[] {
  return spellCheckPluginKey.getState(state)?.errors ?? [];
}

describe('SpellCheckExtension', () => {
  it('maps an error when text is inserted before its range', () => {
    let state = setErrors(createState('Bonjour maisson'), [
      { word: 'maisson', from: 9, to: 16, suggestions: ['maison'] },
    ]);

    state = state.apply(state.tr.insertText('Cher ', 1));

    expect(getErrors(state)).toEqual([
      { word: 'maisson', from: 14, to: 21, suggestions: ['maison'] },
    ]);
  });

  it('removes an error as soon as its range is edited', () => {
    let state = setErrors(createState('Bonjour maisson'), [
      { word: 'maisson', from: 9, to: 16, suggestions: ['maison'] },
    ]);

    state = state.apply(state.tr.insertText('n', 15));

    expect(getErrors(state)).toEqual([]);
  });
});
