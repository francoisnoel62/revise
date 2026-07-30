// ABOUTME: TipTap extension for dictionary-based spell checking
// ABOUTME: Adds red underline decorations to misspelled words via ProseMirror Plugin

import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
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

function createDecorations(doc: ProseMirrorNode, errors: SpellError[]): DecorationSet {
  return DecorationSet.create(
    doc,
    errors.map(({ from, to, word, suggestions }) =>
      Decoration.inline(from, to, {
        class: 'spell-error',
        'data-spell-word': word,
        'data-spell-suggestions': suggestions.join('|'),
      })
    )
  );
}

function mapUntouchedErrors(tr: Transaction, errors: SpellError[]): SpellError[] {
  return errors.flatMap((error) => {
    let from = error.from;
    let to = error.to;

    for (const map of tr.mapping.maps) {
      let touched = false;
      map.forEach((oldStart, oldEnd) => {
        const isInsertion = oldStart === oldEnd;
        if (isInsertion) {
          touched ||= oldStart > from && oldStart < to;
        } else {
          touched ||= oldStart < to && oldEnd > from;
        }
      });

      if (touched) return [];

      from = map.map(from, 1);
      to = map.map(to, -1);
      if (from >= to) return [];
    }

    return [{ ...error, from, to }];
  });
}

export function createSpellCheckPlugin() {
  return new Plugin({
    key: spellCheckPluginKey,
    state: {
      init() {
        return { decorations: DecorationSet.empty, errors: [] as SpellError[] };
      },
      apply(tr, prev, _oldState, newState) {
        const meta = tr.getMeta(spellCheckPluginKey);
        if (meta?.errors !== undefined) {
          const errors = meta.errors as SpellError[];
          return { decorations: createDecorations(newState.doc, errors), errors };
        }
        if (tr.docChanged) {
          const errors = mapUntouchedErrors(tr, prev.errors);
          return {
            decorations: createDecorations(tr.doc, errors),
            errors,
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
  });
}

export const SpellCheckExtension = Extension.create({
  name: 'spellCheck',

  addProseMirrorPlugins() {
    return [createSpellCheckPlugin()];
  },
});
