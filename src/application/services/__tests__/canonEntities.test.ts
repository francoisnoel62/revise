// ABOUTME: Tests for detectEntities (known cast ∩ local window)
// ABOUTME: Covers casing, word boundaries, accents, multi-word names, dedupe and empty inputs

import { describe, it, expect } from 'vitest';
import { detectEntities } from '../canonEntities';

describe('detectEntities', () => {
  it('finds known names present in the text', () => {
    expect(detectEntities('Léa regarda Tom.', ['Léa', 'Tom', 'Marc'])).toEqual(['Léa', 'Tom']);
  });

  it('is case-insensitive', () => {
    expect(detectEntities('léa entra', ['Léa'])).toEqual(['Léa']);
  });

  it('matches whole words only (no partial)', () => {
    expect(detectEntities('Léane parlait', ['Léa'])).toEqual([]);
    expect(detectEntities('Tommy courait', ['Tom'])).toEqual([]);
  });

  it('supports multi-word names', () => {
    expect(detectEntities('Mlle Dubois arriva', ['Mlle Dubois'])).toEqual(['Mlle Dubois']);
  });

  it('deduplicates repeated names and preserves cast order', () => {
    expect(detectEntities('Tom, puis Tom encore, puis Léa', ['Léa', 'Tom'])).toEqual([
      'Léa',
      'Tom',
    ]);
  });

  it('returns empty for empty text or empty cast', () => {
    expect(detectEntities('', ['Léa'])).toEqual([]);
    expect(detectEntities('du texte', [])).toEqual([]);
  });

  it('ignores blank cast entries', () => {
    expect(detectEntities('Léa', ['  ', 'Léa'])).toEqual(['Léa']);
  });
});
