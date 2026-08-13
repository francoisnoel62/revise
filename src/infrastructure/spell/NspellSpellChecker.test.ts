// ABOUTME: Tests for the nspell-backed implementation of the domain spell-checking port.
// ABOUTME: Uses the real fr-FR dictionary — no mocks, so the adapter is validated as shipped.

import { describe, it, expect } from 'vitest';
import { loadNspellSpellChecker } from './NspellSpellChecker';

describe('NspellSpellChecker', () => {
  it('recognises a correctly spelled French word and rejects a misspelling', async () => {
    const checker = await loadNspellSpellChecker();

    expect(checker.correct('maison')).toBe(true);
    expect(checker.correct('maisson')).toBe(false);
  }, 60_000);

  it('suggests the right word for a typo', async () => {
    const checker = await loadNspellSpellChecker();

    expect(checker.suggest('maisson')).toContain('maison');
  }, 60_000);

  /**
   * Reading and parsing the dictionary costs seconds. Two chapters checked at once used to
   * start two engines and keep the last one, paying twice and holding both in memory until
   * the loser was collected. Memoising the promise rather than the instance is what makes a
   * second caller wait for the first load instead of starting its own.
   */
  it('loads once however many callers ask at the same time', async () => {
    const [first, second, third] = await Promise.all([
      loadNspellSpellChecker(),
      loadNspellSpellChecker(),
      loadNspellSpellChecker(),
    ]);

    expect(second).toBe(first);
    expect(third).toBe(first);
  }, 60_000);
});
