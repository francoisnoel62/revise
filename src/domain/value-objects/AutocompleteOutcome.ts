// ABOUTME: Issue terminale d'une suggestion d'autocomplétion (pour l'instrumentation).
// ABOUTME: accepted_full | accepted_partial | rejected_escape | superseded_typing | empty | prefetch_discarded.

export const AUTOCOMPLETE_OUTCOMES = [
  'accepted_full',
  'accepted_partial',
  'rejected_escape',
  'superseded_typing',
  'empty',
  // A silently prefetched suggestion that was ready but invalidated before the
  // author promoted it (Tab) — i.e. an LLM call we paid for and threw away.
  'prefetch_discarded',
] as const;

export type AutocompleteOutcome = (typeof AUTOCOMPLETE_OUTCOMES)[number];

export function isValidAutocompleteOutcome(value: string): value is AutocompleteOutcome {
  return (AUTOCOMPLETE_OUTCOMES as readonly string[]).includes(value);
}
