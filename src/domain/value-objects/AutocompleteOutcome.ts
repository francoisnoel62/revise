// ABOUTME: Issue terminale d'une suggestion d'autocomplétion (pour l'instrumentation).
// ABOUTME: accepted_full | rejected_escape | superseded_typing | empty.

export const AUTOCOMPLETE_OUTCOMES = [
  'accepted_full',
  'rejected_escape',
  'superseded_typing',
  'empty',
] as const;

export type AutocompleteOutcome = (typeof AUTOCOMPLETE_OUTCOMES)[number];

export function isValidAutocompleteOutcome(value: string): value is AutocompleteOutcome {
  return (AUTOCOMPLETE_OUTCOMES as readonly string[]).includes(value);
}
