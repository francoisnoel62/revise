// ABOUTME: Tests for the AutocompleteOutcome value object
// ABOUTME: Covers the allowed set and the type guard

import { describe, it, expect } from 'vitest';
import {
  AUTOCOMPLETE_OUTCOMES,
  isValidAutocompleteOutcome,
} from '../AutocompleteOutcome';

describe('AutocompleteOutcome', () => {
  it('contains the expected outcomes', () => {
    expect(AUTOCOMPLETE_OUTCOMES).toEqual([
      'accepted_full',
      'accepted_partial',
      'rejected_escape',
      'superseded_typing',
      'empty',
      'prefetch_discarded',
    ]);
  });

  it('accepts valid outcomes', () => {
    expect(isValidAutocompleteOutcome('accepted_full')).toBe(true);
    expect(isValidAutocompleteOutcome('accepted_partial')).toBe(true);
    expect(isValidAutocompleteOutcome('rejected_escape')).toBe(true);
    expect(isValidAutocompleteOutcome('superseded_typing')).toBe(true);
    expect(isValidAutocompleteOutcome('empty')).toBe(true);
    expect(isValidAutocompleteOutcome('prefetch_discarded')).toBe(true);
  });

  it('rejects invalid outcomes', () => {
    expect(isValidAutocompleteOutcome('accepted')).toBe(false);
    expect(isValidAutocompleteOutcome('')).toBe(false);
    expect(isValidAutocompleteOutcome('ACCEPTED_FULL')).toBe(false);
  });
});
