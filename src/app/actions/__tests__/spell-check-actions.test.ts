// ABOUTME: Unit tests for checkSpellingAction using the real nspell + fr-FR dictionary
// ABOUTME: Validates filtering logic: correct words pass, misspellings are flagged, edge cases respected

import { describe, it, expect, beforeAll } from 'vitest';
import { checkSpellingAction } from '../spell-check-actions';

// These tests use the real fr-FR dictionary — no mocks, so they validate actual spell-check logic.
// Dictionary initialisation happens once via the module-level singleton; subsequent tests are fast.
// The beforeAll pre-warms the singleton so individual tests are not slowed by disk I/O.

describe('checkSpellingAction', () => {
  beforeAll(async () => {
    // Warm up the singleton — dictionary-fr reads from disk the first time (~5s)
    await checkSpellingAction(['init']);
  }, 15_000);
  it('returns an empty array when given no words', async () => {
    const result = await checkSpellingAction([]);
    expect(result).toEqual([]);
  });

  it('does not flag correctly spelled French words', async () => {
    const result = await checkSpellingAction(['maison', 'livre', 'bonjour', 'écriture']);
    expect(result).toEqual([]);
  });

  it('flags a misspelled word', async () => {
    const result = await checkSpellingAction(['maisson']);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('maisson');
  });

  it('includes the correct spelling among suggestions for a simple typo', async () => {
    const result = await checkSpellingAction(['maisson']);
    expect(result[0].suggestions).toContain('maison');
  });

  it('limits suggestions to at most 5 per word', async () => {
    const result = await checkSpellingAction(['livrre']);
    if (result.length > 0) {
      expect(result[0].suggestions.length).toBeLessThanOrEqual(5);
    }
  });

  it('does not flag a word that is correct when lowercased (sentence-initial / proper noun)', async () => {
    // "Maison" is correct when lowercased → should be accepted
    const result = await checkSpellingAction(['Maison', 'Bonjour', 'Écriture']);
    expect(result).toEqual([]);
  });

  it('ignores words shorter than 2 characters', async () => {
    const result = await checkSpellingAction(['a', 'é', 'x']);
    expect(result).toEqual([]);
  });

  it('returns only the misspelled words from a mixed list', async () => {
    const result = await checkSpellingAction(['maison', 'maisson', 'livre', 'livrre']);
    const flagged = result.map((r) => r.word);
    expect(flagged).toContain('maisson');
    expect(flagged).toContain('livrre');
    expect(flagged).not.toContain('maison');
    expect(flagged).not.toContain('livre');
  });

  it('handles a list of only correct words without returning any results', async () => {
    const result = await checkSpellingAction(['chat', 'chien', 'oiseau', 'poisson']);
    expect(result).toEqual([]);
  });
});
