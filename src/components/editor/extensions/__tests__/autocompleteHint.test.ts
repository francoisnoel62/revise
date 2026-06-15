// ABOUTME: Tests for the autocomplete shortcut hint copy
// ABOUTME: Verifies that variant cycling is discoverable without changing editor behavior

import { describe, expect, it } from 'vitest';
import {
  AUTOCOMPLETE_INTENT_LABELS,
  autocompleteShortcutHint,
} from '../autocompleteHint';

describe('autocompleteShortcutHint', () => {
  it('explains the main autocomplete shortcuts for the natural suggestion', () => {
    expect(autocompleteShortcutHint('natural')).toBe(
      'Tab accepter · Ctrl/Cmd+. variante · Échap refuser'
    );
  });

  it('adds the active variant label after cycling intent', () => {
    expect(autocompleteShortcutHint('shorter')).toContain('plus bref');
    expect(autocompleteShortcutHint('tenser')).toContain('plus tendu');
    expect(autocompleteShortcutHint('more_concrete')).toContain('plus concret');
    expect(autocompleteShortcutHint('dialogue')).toContain('dialogue');
  });

  it('keeps labels defined for every intent', () => {
    expect(AUTOCOMPLETE_INTENT_LABELS).toEqual({
      natural: 'naturel',
      shorter: 'plus bref',
      tenser: 'plus tendu',
      more_concrete: 'plus concret',
      dialogue: 'dialogue',
    });
  });
});
