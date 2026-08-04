// ABOUTME: Unit tests for the author-facing category of a positioned text issue.
// ABOUTME: Guarantees the nature of an issue is readable without relying on colour.

import { describe, expect, it } from 'vitest';
import { textIssueCategory, type TextIssue } from '../TextIssue';

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
