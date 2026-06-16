// ABOUTME: Tests for the pure suggestion segment helpers (partial acceptance)
// ABOUTME: Covers word/fragment boundaries, punctuation, FR spaces, and edge cases

import { describe, it, expect } from 'vitest';
import { nextWord, nextFragment } from '../suggestionSegments';

describe('nextWord', () => {
  it('takes the first word with its trailing space', () => {
    expect(nextWord('découvrit une pièce')).toEqual({
      take: 'découvrit ',
      rest: 'une pièce',
    });
  });

  it('takes the only word when there is no space', () => {
    expect(nextWord('pièce')).toEqual({ take: 'pièce', rest: '' });
  });

  it('handles an empty string', () => {
    expect(nextWord('')).toEqual({ take: '', rest: '' });
  });

  it('reassembles to the original (take + rest)', () => {
    const s = '  une  pièce sombre';
    const { take, rest } = nextWord(s);
    expect(take + rest).toBe(s);
  });
});

describe('nextFragment', () => {
  it('takes up to and including the next strong boundary', () => {
    expect(nextFragment('découvrit une pièce, sombre et froide')).toEqual({
      take: 'découvrit une pièce, ',
      rest: 'sombre et froide',
    });
  });

  it('stops at a period', () => {
    const { take, rest } = nextFragment('Il entra. Puis hésita.');
    expect(take).toBe('Il entra. ');
    expect(rest).toBe('Puis hésita.');
  });

  it('takes the whole string when there is no boundary', () => {
    expect(nextFragment('sans ponctuation finale')).toEqual({
      take: 'sans ponctuation finale',
      rest: '',
    });
  });

  it('handles an empty string', () => {
    expect(nextFragment('')).toEqual({ take: '', rest: '' });
  });
});
