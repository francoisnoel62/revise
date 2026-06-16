// ABOUTME: Implicit intent for a completion variant — natural by default, cycled discreetly
// ABOUTME: natural | shorter | tenser | more_concrete | dialogue

export const AUTOCOMPLETE_INTENTS = [
  'natural',
  'shorter',
  'tenser',
  'more_concrete',
  'dialogue',
] as const;

export type AutocompleteIntent = (typeof AUTOCOMPLETE_INTENTS)[number];

export function isValidAutocompleteIntent(value: string): value is AutocompleteIntent {
  return (AUTOCOMPLETE_INTENTS as readonly string[]).includes(value);
}

/** The next intent in the cycle (wraps around). Used by the discrete "regenerate" shortcut. */
export function nextAutocompleteIntent(current: AutocompleteIntent): AutocompleteIntent {
  const i = AUTOCOMPLETE_INTENTS.indexOf(current);
  return AUTOCOMPLETE_INTENTS[(i + 1) % AUTOCOMPLETE_INTENTS.length];
}

/**
 * The intent at the given 1-based position (1 = natural … 5 = dialogue), or null
 * when out of range. Used by the number shortcuts to pick a variant directly.
 */
export function autocompleteIntentByNumber(n: number): AutocompleteIntent | null {
  if (!Number.isInteger(n) || n < 1 || n > AUTOCOMPLETE_INTENTS.length) {
    return null;
  }
  return AUTOCOMPLETE_INTENTS[n - 1];
}
