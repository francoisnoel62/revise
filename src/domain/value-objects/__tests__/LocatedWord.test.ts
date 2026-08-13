// ABOUTME: Tests for locating words in a chapter and turning them into spelling issues.
// ABOUTME: Pins the word boundary rule and the offsetting that places a range in the document.

import { describe, it, expect } from 'vitest';
import { locateWords, spellingIssueAt } from '../LocatedWord';

describe('locateWords', () => {
  it('locates each word with its range, offset from where the text starts', () => {
    expect(locateWords('bois maisson', 1)).toEqual([
      { word: 'bois', from: 1, to: 5 },
      { word: 'maisson', from: 6, to: 13 },
    ]);
  });

  it('keeps accents and combining marks inside the word', () => {
    expect(locateWords('arrêtée', 0)).toEqual([{ word: 'arrêtée', from: 0, to: 7 }]);
  });

  it('ignores single letters and punctuation, which carry no spelling to judge', () => {
    expect(locateWords('à 12 h, il partit !', 0).map((located) => located.word)).toEqual([
      'il',
      'partit',
    ]);
  });

  it('reports the same word as many times as it appears', () => {
    expect(locateWords('bonjour monde bonjour', 0)).toHaveLength(3);
  });

  it('starts afresh on every call rather than resuming the previous scan', () => {
    expect(locateWords('bois maisson', 0)).toEqual(locateWords('bois maisson', 0));
  });
});

describe('spellingIssueAt', () => {
  it('places the dictionary’s answer back onto the word it was asked about', () => {
    expect(spellingIssueAt({ word: 'maisson', from: 6, to: 13 }, ['maison'])).toEqual({
      nature: 'spelling',
      from: 6,
      to: 13,
      text: 'maisson',
      message: '',
      suggestions: ['maison'],
    });
  });
});
