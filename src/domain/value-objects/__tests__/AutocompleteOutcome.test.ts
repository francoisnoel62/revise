// ABOUTME: Tests for the AutocompleteOutcome value object
// ABOUTME: Covers the allowed set and the type guard

import { describe, it, expect } from 'vitest';
import {
  AUTOCOMPLETE_OUTCOMES,
  isValidAutocompleteOutcome,
} from '../AutocompleteOutcome';

describe('AutocompleteOutcome', () => {
  it('contains exactly the four Phase 1 outcomes', () => {
    expect(AUTOCOMPLETE_OUTCOMES).toEqual([
      'accepted_full',
      'rejected_escape',
      'superseded_typing',
      'empty',
    ]);
  });

  it('accepts valid outcomes', () => {
    expect(isValidAutocompleteOutcome('accepted_full')).toBe(true);
    expect(isValidAutocompleteOutcome('rejected_escape')).toBe(true);
    expect(isValidAutocompleteOutcome('superseded_typing')).toBe(true);
    expect(isValidAutocompleteOutcome('empty')).toBe(true);
  });

  it('rejects invalid outcomes', () => {
    expect(isValidAutocompleteOutcome('accepted')).toBe(false);
    expect(isValidAutocompleteOutcome('')).toBe(false);
    expect(isValidAutocompleteOutcome('ACCEPTED_FULL')).toBe(false);
  });
});
