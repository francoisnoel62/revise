// ABOUTME: Tests for the AutocompleteIntent value object
// ABOUTME: Covers the allowed set, the guard, and the cycling helper

import { describe, it, expect } from 'vitest';
import {
  AUTOCOMPLETE_INTENTS,
  autocompleteIntentByNumber,
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

  it('maps a 1-based number to its intent', () => {
    expect(autocompleteIntentByNumber(1)).toBe('natural');
    expect(autocompleteIntentByNumber(2)).toBe('shorter');
    expect(autocompleteIntentByNumber(3)).toBe('tenser');
    expect(autocompleteIntentByNumber(4)).toBe('more_concrete');
    expect(autocompleteIntentByNumber(5)).toBe('dialogue');
  });

  it('returns null for numbers outside the variant range', () => {
    expect(autocompleteIntentByNumber(0)).toBeNull();
    expect(autocompleteIntentByNumber(6)).toBeNull();
    expect(autocompleteIntentByNumber(-1)).toBeNull();
    expect(autocompleteIntentByNumber(2.5)).toBeNull();
  });
});
