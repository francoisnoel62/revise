// ABOUTME: Integration tests for the ProseMirror text-issue plugin state.
// ABOUTME: Covers position mapping, red/green cohabitation, and decoration styling.

import { describe, expect, it } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import {
  createTextIssuePlugin,
  textIssuePluginKey,
  type TextIssueMeta,
} from '../TextIssueExtension';

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
    plugins: [createTextIssuePlugin()],
  });
}

function setIssues(state: EditorState, meta: TextIssueMeta) {
  return state.apply(state.tr.setMeta(textIssuePluginKey, meta));
}

function getIssues(state: EditorState): TextIssue[] {
  return textIssuePluginKey.getState(state)?.issues ?? [];
}

function getDecorations(state: EditorState) {
  return textIssuePluginKey.getState(state)?.decorations.find() ?? [];
}

const misspelling = (overrides: Partial<TextIssue> = {}): TextIssue => ({
  nature: 'spelling',
  from: 9,
  to: 16,
  text: 'maisson',
  message: '',
  suggestions: ['maison'],
  ...overrides,
});

const agreementError = (overrides: Partial<TextIssue> = {}): TextIssue => ({
  nature: 'grammar',
  from: 1,
  to: 4,
  text: 'Les',
  message: 'Accord de nombre erroné.',
  suggestions: ['Le'],
  ruleFamily: 'gn',
  ...overrides,
});

describe('TextIssueExtension', () => {
  it('maps an issue when text is inserted before its range', () => {
    let state = setIssues(createState('Bonjour maisson'), { spelling: [misspelling()] });

    state = state.apply(state.tr.insertText('Cher ', 1));

    expect(getIssues(state)).toEqual([misspelling({ from: 14, to: 21 })]);
  });

  it('removes an issue as soon as its range is edited', () => {
    let state = setIssues(createState('Bonjour maisson'), { spelling: [misspelling()] });

    state = state.apply(state.tr.insertText('n', 15));

    expect(getIssues(state)).toEqual([]);
    expect(getDecorations(state)).toEqual([]);
  });

  it('maps grammar issues the same way as spelling issues', () => {
    let state = setIssues(createState('Les chien dorment'), {
      grammar: [agreementError({ from: 5, to: 10, text: 'chien' })],
    });

    state = state.apply(state.tr.insertText('Oh ', 1));

    expect(getIssues(state)).toEqual([agreementError({ from: 8, to: 13, text: 'chien' })]);
  });

  it('keeps both sources in a single list ordered by position', () => {
    const state = setIssues(createState('Les chien maisson'), {
      spelling: [misspelling({ from: 11, to: 18 })],
      grammar: [agreementError({ from: 5, to: 10, text: 'chien' })],
    });

    expect(getIssues(state).map((issue) => issue.nature)).toEqual(['grammar', 'spelling']);
  });

  it('drops a grammar issue overlapping a misspelling', () => {
    const state = setIssues(createState('Les chienn dorment'), {
      spelling: [misspelling({ from: 5, to: 11, text: 'chienn' })],
      grammar: [agreementError({ from: 1, to: 11, text: 'Les chienn' })],
    });

    expect(getIssues(state).map((issue) => issue.nature)).toEqual(['spelling']);
  });

  it('keeps a grammar issue merely adjacent to a misspelling', () => {
    const state = setIssues(createState('Les chienn'), {
      spelling: [misspelling({ from: 5, to: 11, text: 'chienn' })],
      grammar: [agreementError({ from: 1, to: 5, text: 'Les ' })],
    });

    expect(getIssues(state)).toHaveLength(2);
  });

  it('replaces only the source it is given', () => {
    let state = setIssues(createState('Les chien maisson'), {
      grammar: [agreementError({ from: 5, to: 10, text: 'chien' })],
    });

    state = setIssues(state, { spelling: [misspelling({ from: 11, to: 18 })] });

    expect(getIssues(state)).toHaveLength(2);

    state = setIssues(state, { grammar: [] });

    expect(getIssues(state).map((issue) => issue.nature)).toEqual(['spelling']);
  });

  it('decorates spelling and grammar issues with distinct classes', () => {
    const state = setIssues(createState('Les chien maisson'), {
      spelling: [misspelling({ from: 11, to: 18 })],
      grammar: [agreementError({ from: 5, to: 10, text: 'chien' })],
    });

    const classes = getDecorations(state).map(
      (decoration) => (decoration.type as unknown as { attrs: Record<string, string> }).attrs.class
    );

    expect(classes).toEqual(['grammar-error', 'spell-error']);
  });

  it('exposes the flagged word and suggestions on a spelling decoration', () => {
    const state = setIssues(createState('Bonjour maisson'), { spelling: [misspelling()] });

    const [decoration] = getDecorations(state);
    const attrs = (decoration.type as unknown as { attrs: Record<string, string> }).attrs;

    expect(attrs['data-spell-word']).toBe('maisson');
    expect(attrs['data-spell-suggestions']).toBe('maison');
  });

  it('exposes the rule family and category on a grammar decoration', () => {
    const state = setIssues(createState('Les chien dorment'), {
      grammar: [agreementError({ from: 5, to: 10, text: 'chien' })],
    });

    const [decoration] = getDecorations(state);
    const attrs = (decoration.type as unknown as { attrs: Record<string, string> }).attrs;

    expect(attrs['data-grammar-family']).toBe('gn');
    expect(attrs['data-grammar-category']).toBe('Accord');
  });
});
