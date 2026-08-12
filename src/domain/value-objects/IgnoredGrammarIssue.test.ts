// ABOUTME: Test suite for a grammar remark the author has declined in a project.
// ABOUTME: Covers what counts as the same remark coming back.

import { describe, expect, it } from 'vitest';
import type { TextIssue } from './TextIssue';
import {
  isIgnoredGrammarIssue,
  toIgnoredGrammarIssue,
  type IgnoredGrammarIssue,
} from './IgnoredGrammarIssue';

const agreement: TextIssue = {
  nature: 'grammar',
  from: 5,
  to: 10,
  text: 'chien',
  message: 'Accord de nombre erroné.',
  suggestions: ['chiens'],
  ruleFamily: 'gn',
};

describe('toIgnoredGrammarIssue', () => {
  it('keeps the rule family and the flagged text, not the position', () => {
    expect(toIgnoredGrammarIssue(agreement)).toEqual({
      ruleFamily: 'gn',
      text: 'chien',
    });
  });

  it('trims the flagged text', () => {
    expect(toIgnoredGrammarIssue({ ...agreement, text: '  chien ' }).text).toBe('chien');
  });
});

describe('isIgnoredGrammarIssue', () => {
  const declined: IgnoredGrammarIssue[] = [{ ruleFamily: 'gn', text: 'chien' }];

  it('recognises the same remark wherever it comes back', () => {
    expect(isIgnoredGrammarIssue({ ...agreement, from: 90, to: 95 }, declined)).toBe(true);
  });

  it('still reports the same rule on different text', () => {
    expect(isIgnoredGrammarIssue({ ...agreement, text: 'chat' }, declined)).toBe(false);
  });

  it('still reports a different rule on the same text', () => {
    expect(isIgnoredGrammarIssue({ ...agreement, ruleFamily: 'ppas' }, declined)).toBe(false);
  });

  it('tells apart what the author wrote in different case', () => {
    // "Chien" opening a sentence is not the word they waved away mid-sentence.
    expect(isIgnoredGrammarIssue({ ...agreement, text: 'Chien' }, declined)).toBe(false);
  });

  it('reports everything when nothing has been declined', () => {
    expect(isIgnoredGrammarIssue(agreement, [])).toBe(false);
  });
});
