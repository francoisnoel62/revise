// ABOUTME: Tests for the CanonFacts value object guard (LLM extraction output shape)
// ABOUTME: Providers use isValidExtractedCanonFact to validate parsed JSON before trusting it

import { describe, it, expect } from 'vitest';
import { isValidExtractedCanonFact } from '../CanonFacts';

describe('isValidExtractedCanonFact', () => {
  it('accepts a well-formed extracted fact', () => {
    expect(
      isValidExtractedCanonFact({
        entity: 'Léa',
        statement: 'est morte',
        validFromChapter: 9,
        evidence: 'Léa rendit son dernier souffle.',
      })
    ).toBe(true);
  });

  it('rejects empty entity or statement', () => {
    expect(
      isValidExtractedCanonFact({ entity: '', statement: 'x', validFromChapter: 0, evidence: 'e' })
    ).toBe(false);
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: '  ', validFromChapter: 0, evidence: 'e' })
    ).toBe(false);
  });

  it('rejects negative or non-integer chapter index', () => {
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: -1, evidence: 'e' })
    ).toBe(false);
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 1.5, evidence: 'e' })
    ).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(isValidExtractedCanonFact(null)).toBe(false);
    expect(isValidExtractedCanonFact('nope')).toBe(false);
    expect(isValidExtractedCanonFact(42)).toBe(false);
  });

  it('accepts a fact with a valid category (1-5)', () => {
    for (const category of [1, 2, 3, 4, 5] as const) {
      expect(
        isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 0, evidence: 'e', category })
      ).toBe(true);
    }
  });

  it('accepts a fact without a category (optional field)', () => {
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 0, evidence: 'e' })
    ).toBe(true);
  });

  it('rejects a fact with an out-of-range category', () => {
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 0, evidence: 'e', category: 6 })
    ).toBe(false);
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 0, evidence: 'e', category: 0 })
    ).toBe(false);
    expect(
      isValidExtractedCanonFact({ entity: 'Léa', statement: 'x', validFromChapter: 0, evidence: 'e', category: 'croyance' })
    ).toBe(false);
  });
});
