// ABOUTME: TipTap extension holding every located writing issue of the open chapter.
// ABOUTME: Spelling underlines in wavy red, grammar in dotted green, from one ordered list.

import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { textIssueCategory, type TextIssue } from '@/domain/value-objects/TextIssue';

/** Issues of one nature, replacing the ones previously held for that nature. */
export interface TextIssueMeta {
  spelling?: TextIssue[];
  grammar?: TextIssue[];
}

export interface TextIssueState {
  /** Spelling issues as last reported, before overlap arbitration. */
  spelling: TextIssue[];
  /** Grammar issues as last reported, before overlap arbitration. */
  grammar: TextIssue[];
  /** What the author sees: both sources merged, arbitrated and ordered. */
  issues: TextIssue[];
  decorations: DecorationSet;
}

export const textIssuePluginKey = new PluginKey<TextIssueState>('textIssues');

/**
 * Merges both sources into the single list the palette works on.
 *
 * Spelling wins on overlap: the grammar engine stays silent on the morphology of
 * a word it does not know, so a grammar range containing a misspelling is
 * unreliable anyway.
 */
export function mergeTextIssues(
  spelling: readonly TextIssue[],
  grammar: readonly TextIssue[]
): TextIssue[] {
  const withoutOverlaps = grammar.filter(
    (issue) =>
      !spelling.some(
        (misspelling) => misspelling.from < issue.to && misspelling.to > issue.from
      )
  );

  return [...spelling, ...withoutOverlaps].sort((a, b) => a.from - b.from || a.to - b.to);
}

function decorate(issue: TextIssue): Decoration {
  if (issue.nature === 'spelling') {
    return Decoration.inline(issue.from, issue.to, {
      class: 'spell-error',
      'data-spell-word': issue.text,
      'data-spell-suggestions': issue.suggestions.join('|'),
    });
  }

  return Decoration.inline(issue.from, issue.to, {
    class: 'grammar-error',
    'data-grammar-family': issue.ruleFamily ?? '',
    'data-grammar-category': textIssueCategory(issue),
  });
}

function createDecorations(doc: ProseMirrorNode, issues: TextIssue[]): DecorationSet {
  return DecorationSet.create(doc, issues.map(decorate));
}

function buildState(
  doc: ProseMirrorNode,
  spelling: TextIssue[],
  grammar: TextIssue[]
): TextIssueState {
  const issues = mergeTextIssues(spelling, grammar);
  return { spelling, grammar, issues, decorations: createDecorations(doc, issues) };
}

function mapUntouchedIssues(tr: Transaction, issues: TextIssue[]): TextIssue[] {
  return issues.flatMap((issue) => {
    let from = issue.from;
    let to = issue.to;

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

    return [{ ...issue, from, to }];
  });
}

export function createTextIssuePlugin() {
  return new Plugin<TextIssueState>({
    key: textIssuePluginKey,
    state: {
      init() {
        return { spelling: [], grammar: [], issues: [], decorations: DecorationSet.empty };
      },
      apply(tr, prev, _oldState, newState) {
        const meta = tr.getMeta(textIssuePluginKey) as TextIssueMeta | undefined;
        if (meta) {
          return buildState(
            newState.doc,
            meta.spelling ?? prev.spelling,
            meta.grammar ?? prev.grammar
          );
        }
        if (tr.docChanged) {
          return buildState(
            tr.doc,
            mapUntouchedIssues(tr, prev.spelling),
            mapUntouchedIssues(tr, prev.grammar)
          );
        }
        return prev;
      },
    },
    props: {
      decorations(state) {
        return textIssuePluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

export const TextIssueExtension = Extension.create({
  name: 'textIssues',

  addProseMirrorPlugins() {
    return [createTextIssuePlugin()];
  },
});
