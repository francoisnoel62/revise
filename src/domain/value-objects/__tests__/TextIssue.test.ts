// ABOUTME: Unit tests for the author-facing category of a positioned text issue.
// ABOUTME: Guarantees the nature is readable without colour, and that spelling wins on overlap.

import { describe, expect, it } from 'vitest';
import { mergeTextIssues, textIssueCategory, type TextIssue } from '../TextIssue';

const issue = (overrides: Partial<TextIssue>): TextIssue => ({
  nature: 'grammar',
  from: 1,
  to: 2,
  text: 'chien',
  message: '',
  suggestions: [],
  ...overrides,
});

describe('textIssueCategory', () => {
  it('names a spelling issue', () => {
    expect(textIssueCategory(issue({ nature: 'spelling' }))).toBe('Orthographe');
  });

  it('names an agreement issue after its rule family', () => {
    expect(textIssueCategory(issue({ ruleFamily: 'gn' }))).toBe('Accord');
    expect(textIssueCategory(issue({ ruleFamily: 'ppas' }))).toBe('Accord');
  });

  it('names conjugation, confusion and punctuation issues', () => {
    expect(textIssueCategory(issue({ ruleFamily: 'conj' }))).toBe('Conjugaison');
    expect(textIssueCategory(issue({ ruleFamily: 'conf' }))).toBe('Confusion');
    expect(textIssueCategory(issue({ ruleFamily: 'virg' }))).toBe('Ponctuation');
  });

  it('falls back to a generic grammar category for an unmapped family', () => {
    expect(textIssueCategory(issue({ ruleFamily: 'brand-new-family' }))).toBe('Grammaire');
    expect(textIssueCategory(issue({ ruleFamily: undefined }))).toBe('Grammaire');
  });
});

const misspelling = (from: number, to: number): TextIssue =>
  issue({ nature: 'spelling', from, to, text: 'maisson', suggestions: ['maison'] });

const agreementError = (from: number, to: number): TextIssue =>
  issue({ nature: 'grammar', from, to, ruleFamily: 'gn' });

describe('mergeTextIssues', () => {
  it('keeps both natures when nothing overlaps', () => {
    const merged = mergeTextIssues([misspelling(20, 27)], [agreementError(1, 4)]);

    expect(merged.map((i) => i.nature)).toEqual(['grammar', 'spelling']);
  });

  it('orders the merged list by position', () => {
    const merged = mergeTextIssues(
      [misspelling(30, 37), misspelling(10, 17)],
      [agreementError(1, 4), agreementError(20, 24)]
    );

    expect(merged.map((i) => i.from)).toEqual([1, 10, 20, 30]);
  });

  it('drops a grammar range overlapping a misspelling — spelling wins', () => {
    const merged = mergeTextIssues([misspelling(5, 12)], [agreementError(1, 8)]);

    expect(merged).toEqual([misspelling(5, 12)]);
  });

  it('drops a grammar range that merely contains a misspelling', () => {
    const merged = mergeTextIssues([misspelling(6, 13)], [agreementError(1, 20)]);

    expect(merged.map((i) => i.nature)).toEqual(['spelling']);
  });

  it('keeps a grammar range that only touches a misspelling end to end', () => {
    const merged = mergeTextIssues([misspelling(4, 9)], [agreementError(1, 4)]);

    expect(merged.map((i) => i.nature)).toEqual(['grammar', 'spelling']);
  });

  it('returns the spelling list untouched when there is no grammar issue', () => {
    expect(mergeTextIssues([misspelling(1, 8)], [])).toEqual([misspelling(1, 8)]);
  });
});
