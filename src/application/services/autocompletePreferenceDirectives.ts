// ABOUTME: Maps autocomplete length/audace preferences to short prompt directives
// ABOUTME: Directives ride in the context block so the LLMProvider interface stays untouched

import type {
  SuggestionLength,
  AudaceLevel,
} from '../../domain/value-objects/AutocompletePreferences';

const LENGTH_DIRECTIVES: Record<SuggestionLength, string> = {
  short: 'Garde la suite courte : quelques mots à une demi-phrase.',
  medium: '',
  long: 'Tu peux développer un peu plus : une à deux phrases.',
};

const AUDACE_DIRECTIVES: Record<AudaceLevel, string> = {
  prudent: 'Reste sobre et fidèle au texte ; évite les tournures inattendues.',
  balanced: '',
  bold: 'Ose une image ou une tournure plus singulière, sans trahir la voix.',
};

/**
 * Returns the context fragment for a requested suggestion length, or '' for the
 * default (medium). Prepended to the completion context, like intentDirective.
 */
export function lengthDirective(length: SuggestionLength | undefined): string {
  const directive = length ? LENGTH_DIRECTIVES[length] : '';
  return directive ? `\n\n[LONGUEUR DEMANDÉE]\n${directive}\n` : '';
}

/**
 * Returns the context fragment for a requested audace level, or '' for the
 * default (balanced).
 */
export function audaceDirective(audace: AudaceLevel | undefined): string {
  const directive = audace ? AUDACE_DIRECTIVES[audace] : '';
  return directive ? `\n\n[AUDACE DEMANDÉE]\n${directive}\n` : '';
}
