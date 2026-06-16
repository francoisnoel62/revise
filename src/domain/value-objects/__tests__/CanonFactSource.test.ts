// ABOUTME: Tests for the CanonFactSource value object (derived vs author provenance)
// ABOUTME: Guards refutability — author-written facts must be distinguishable from derived ones

import { describe, it, expect } from 'vitest';
import {
  CANON_FACT_SOURCES,
  isValidCanonFactSource,
} from '../CanonFactSource';

describe('CanonFactSource', () => {
  it('lists exactly derived and author', () => {
    expect(CANON_FACT_SOURCES).toEqual(['derived', 'author']);
  });

  it('accepts valid sources', () => {
    expect(isValidCanonFactSource('derived')).toBe(true);
    expect(isValidCanonFactSource('author')).toBe(true);
  });

  it('rejects unknown sources', () => {
    expect(isValidCanonFactSource('ai')).toBe(false);
    expect(isValidCanonFactSource('')).toBe(false);
  });
});
