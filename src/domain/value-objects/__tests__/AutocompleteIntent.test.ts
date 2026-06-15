// ABOUTME: Tests for the AutocompleteIntent value object
// ABOUTME: Covers the allowed set, the guard, and the cycling helper

import { describe, it, expect } from 'vitest';
import {
  AUTOCOMPLETE_INTENTS,
  isValidAutocompleteIntent,
  nextAutocompleteIntent,
} from '../AutocompleteIntent';

describe('AutocompleteIntent', () => {
  it('exposes the expected intents', () => {
    expect(AUTOCOMPLETE_INTENTS).toEqual([
      'natural',
      'shorter',
      'tenser',
      'more_concrete',
      'dialogue',
    ]);
  });

  it('validates intents', () => {
    expect(isValidAutocompleteIntent('natural')).toBe(true);
    expect(isValidAutocompleteIntent('dialogue')).toBe(true);
    expect(isValidAutocompleteIntent('nope')).toBe(false);
    expect(isValidAutocompleteIntent('')).toBe(false);
  });

  it('cycles through intents and wraps around', () => {
    expect(nextAutocompleteIntent('natural')).toBe('shorter');
    expect(nextAutocompleteIntent('shorter')).toBe('tenser');
    expect(nextAutocompleteIntent('dialogue')).toBe('natural');
  });
});
