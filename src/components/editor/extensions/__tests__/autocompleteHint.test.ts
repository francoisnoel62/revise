// ABOUTME: Tests for the autocomplete shortcut hint copy
// ABOUTME: Verifies progressive hint data without coupling to TipTap decorations

import { describe, expect, it } from 'vitest';
import {
  AUTOCOMPLETE_INTENT_LABELS,
  autocompleteShortcutHints,
  autocompleteVariantHints,
  shouldShowAutocompleteVariantHint,
} from '../autocompleteHint';

describe('autocomplete hint helpers', () => {
  it('provides the compact shortcut hint items', () => {
    expect(autocompleteShortcutHints()).toEqual([
      { keys: 'Tab', label: 'accepter' },
      { keys: 'Echap', label: 'ignorer' },
      { keys: 'Ctrl/Cmd+->', label: 'mot' },
      { keys: 'Alt+->', label: 'fragment' },
    ]);
  });

  it('marks only the active variant', () => {
    expect(autocompleteVariantHints('shorter')).toEqual([
      { intent: 'natural', label: 'Autre', active: false },
      { intent: 'shorter', label: 'Plus bref', active: true },
      { intent: 'tenser', label: 'Plus tendu', active: false },
      { intent: 'more_concrete', label: 'Plus concret', active: false },
      { intent: 'dialogue', label: 'Dialogue', active: false },
    ]);
  });

  it('shows the variant row only after leaving the natural intent', () => {
    expect(shouldShowAutocompleteVariantHint('natural')).toBe(false);
    expect(shouldShowAutocompleteVariantHint('shorter')).toBe(true);
    expect(shouldShowAutocompleteVariantHint('tenser')).toBe(true);
    expect(shouldShowAutocompleteVariantHint('more_concrete')).toBe(true);
    expect(shouldShowAutocompleteVariantHint('dialogue')).toBe(true);
  });

  it('keeps labels defined for every intent', () => {
    expect(AUTOCOMPLETE_INTENT_LABELS).toEqual({
      natural: 'Naturel',
      shorter: 'Plus bref',
      tenser: 'Plus tendu',
      more_concrete: 'Plus concret',
      dialogue: 'Dialogue',
    });
  });
});
