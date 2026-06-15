// ABOUTME: Structured UI copy for the discreet autocomplete shortcut hint
// ABOUTME: Keeps shortcut and variant labels testable outside the TipTap decoration layer

import type { AutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';

export const AUTOCOMPLETE_INTENT_LABELS: Record<AutocompleteIntent, string> = {
  natural: 'Naturel',
  shorter: 'Plus bref',
  tenser: 'Plus tendu',
  more_concrete: 'Plus concret',
  dialogue: 'Dialogue',
};

export interface AutocompleteShortcutHintItem {
  keys: string;
  label: string;
}

export interface AutocompleteVariantHintItem {
  intent: AutocompleteIntent;
  label: string;
  active: boolean;
}

export const AUTOCOMPLETE_SHORTCUT_HINTS: AutocompleteShortcutHintItem[] = [
  { keys: 'Tab', label: 'accepter' },
  { keys: 'Echap', label: 'ignorer' },
  { keys: 'Ctrl/Cmd+->', label: 'mot' },
  { keys: 'Alt+->', label: 'fragment' },
];

export const AUTOCOMPLETE_VARIANT_ORDER: AutocompleteIntent[] = [
  'natural',
  'shorter',
  'tenser',
  'more_concrete',
  'dialogue',
];

export function autocompleteShortcutHints(): AutocompleteShortcutHintItem[] {
  return AUTOCOMPLETE_SHORTCUT_HINTS;
}

export function autocompleteVariantHints(
  activeIntent: AutocompleteIntent
): AutocompleteVariantHintItem[] {
  return AUTOCOMPLETE_VARIANT_ORDER.map((intent) => ({
    intent,
    label: intent === 'natural' ? 'Autre' : AUTOCOMPLETE_INTENT_LABELS[intent],
    active: intent === activeIntent,
  }));
}

export function shouldShowAutocompleteVariantHint(intent: AutocompleteIntent): boolean {
  return intent !== 'natural';
}
