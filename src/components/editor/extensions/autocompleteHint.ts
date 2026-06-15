// ABOUTME: UI copy for the discreet autocomplete variant shortcut hint
// ABOUTME: Keeps variant labels testable outside the TipTap decoration layer

import type { AutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';

export const AUTOCOMPLETE_INTENT_LABELS: Record<AutocompleteIntent, string> = {
  natural: 'naturel',
  shorter: 'plus bref',
  tenser: 'plus tendu',
  more_concrete: 'plus concret',
  dialogue: 'dialogue',
};

export function autocompleteShortcutHint(intent: AutocompleteIntent): string {
  const baseHint = 'Tab accepter · Ctrl/Cmd+. variante · Échap refuser';

  if (intent === 'natural') {
    return baseHint;
  }

  return `${baseHint} · ${AUTOCOMPLETE_INTENT_LABELS[intent]}`;
}
