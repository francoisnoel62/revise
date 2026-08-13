// ABOUTME: Tests for the spell-checking use case with a stand-in dictionary.
// ABOUTME: Covers the acceptance rules — capitals, short words, the author's own vocabulary.

import { describe, it, expect } from 'vitest';
import type { SpellChecker } from '@/domain/interfaces/SpellChecker';
import { CheckSpellingUseCase } from '../CheckSpellingUseCase';

/** Knows a fixed vocabulary and suggests by prefix — enough to exercise every rule below. */
function dictionaryOf(...known: string[]): SpellChecker {
  const vocabulary = new Set(known);
  return {
    correct: (word) => vocabulary.has(word),
    suggest: (word) =>
      [...vocabulary].filter((candidate) => candidate.startsWith(word.slice(0, 3))),
  };
}

describe('CheckSpellingUseCase', () => {
  const useCase = (checker: SpellChecker) => new CheckSpellingUseCase(checker);

  it('reports nothing when there is nothing to check', () => {
    expect(useCase(dictionaryOf('maison')).execute({ words: [] })).toEqual([]);
  });

  it('leaves known words alone and reports the others with suggestions', () => {
    const result = useCase(dictionaryOf('maison', 'maisonnette')).execute({
      words: ['maison', 'maisson'],
    });

    expect(result).toEqual([{ word: 'maisson', suggestions: ['maison', 'maisonnette'] }]);
  });

  it('accepts a word the dictionary only knows in lowercase', () => {
    expect(useCase(dictionaryOf('maison')).execute({ words: ['MAISON'] })).toEqual([]);
  });

  /**
   * Proper nouns, place names and sentence starts all begin with a capital, and a novel is
   * full of names no dictionary carries. Flagging them would bury the real mistakes, so a
   * capitalised word is accepted without being looked up. Deliberate, and documented as such.
   */
  it('accepts any word starting with a capital without consulting the dictionary', () => {
    expect(useCase(dictionaryOf()).execute({ words: ['Vaucresson'] })).toEqual([]);
  });

  it('ignores single letters, which carry no spelling to judge', () => {
    expect(useCase(dictionaryOf()).execute({ words: ['a', 'à'] })).toEqual([]);
  });

  it('accepts the words the author declared as their own', () => {
    const result = useCase(dictionaryOf()).execute({
      words: ['vaucresson'],
      acceptedWords: ['vaucresson'],
    });

    expect(result).toEqual([]);
  });

  it('offers at most five suggestions, so the palette stays readable', () => {
    const crowded = dictionaryOf('mai1', 'mai2', 'mai3', 'mai4', 'mai5', 'mai6', 'mai7');

    const [issue] = useCase(crowded).execute({ words: ['maisson'] });

    expect(issue.suggestions).toHaveLength(5);
  });
});
