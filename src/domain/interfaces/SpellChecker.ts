// ABOUTME: Domain interface for dictionary-based spell checking
// ABOUTME: Abstracts the spell checking backend so implementations can be swapped

export interface SpellCheckResult {
  word: string;
  suggestions: string[];
}

export interface SpellChecker {
  correct(word: string): boolean;
  suggest(word: string): string[];
}
