// ABOUTME: TipTap extension for dictionary-based spell checking
// ABOUTME: Adds red underline decorations to misspelled words via ProseMirror Plugin

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SpellError {
  word: string;
  from: number;
  to: number;
  suggestions: string[];
}

export const spellCheckPluginKey = new PluginKey<{
  decorations: DecorationSet;
  errors: SpellError[];
}>('spellCheck');

export const SpellCheckExtension = Extension.create({
  name: 'spellCheck',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, errors: [] as SpellError[] };
          },
          apply(tr, prev, _oldState, newState) {
            const meta = tr.getMeta(spellCheckPluginKey);
            if (meta?.errors !== undefined) {
              const decorations = DecorationSet.create(
                newState.doc,
                (meta.errors as SpellError[]).map(({ from, to, word, suggestions }) =>
                  Decoration.inline(from, to, {
                    class: 'spell-error',
                    'data-spell-word': word,
                    'data-spell-suggestions': suggestions.join('|'),
                  })
                )
              );
              return { decorations, errors: meta.errors as SpellError[] };
            }
            if (tr.docChanged) {
              return {
                decorations: prev.decorations.map(tr.mapping, tr.doc),
                errors: prev.errors,
              };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            return spellCheckPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
