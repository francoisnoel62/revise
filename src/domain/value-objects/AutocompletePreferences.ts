// ABOUTME: Value object for per-project autocomplete preferences
// ABOUTME: All fields optional at persistence level; defaults applied on read

export type SuggestionLength = 'short' | 'medium' | 'long';
export type AudaceLevel = 'prudent' | 'balanced' | 'bold';

export interface AutocompletePreferences {
  enabled: boolean;
  smartPrefetch: boolean;
  suggestionLength: SuggestionLength;
  audace: AudaceLevel;
  learnFromRejections: boolean;
  partialAcceptance: boolean;
}

export const DEFAULT_AUTOCOMPLETE_PREFERENCES: AutocompletePreferences = {
  enabled: true,
  smartPrefetch: true,
  suggestionLength: 'medium',
  audace: 'balanced',
  learnFromRejections: false,
  partialAcceptance: true,
};

const SUGGESTION_LENGTHS: readonly SuggestionLength[] = ['short', 'medium', 'long'];
const AUDACE_LEVELS: readonly AudaceLevel[] = ['prudent', 'balanced', 'bold'];

export function isValidSuggestionLength(value: unknown): value is SuggestionLength {
  return typeof value === 'string' && (SUGGESTION_LENGTHS as readonly string[]).includes(value);
}

export function isValidAudaceLevel(value: unknown): value is AudaceLevel {
  return typeof value === 'string' && (AUDACE_LEVELS as readonly string[]).includes(value);
}
