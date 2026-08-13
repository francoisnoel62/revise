// ABOUTME: Use case checking a list of words against a dictionary and the author's own vocabulary.
// ABOUTME: Owns the acceptance rules, so they are testable without a real spelling engine.

import type { SpellChecker, SpellCheckResult } from '../../domain/interfaces/SpellChecker';

export interface CheckSpellingInput {
  words: readonly string[];
  /** Words the author declared or chose to ignore — accepted whatever the dictionary says. */
  acceptedWords?: readonly string[];
}

/** More than a handful of suggestions is a list nobody reads. */
const MAX_SUGGESTIONS = 5;

/** A single letter carries no spelling to judge. */
const MIN_CHECKABLE_LENGTH = 2;

export class CheckSpellingUseCase {
  constructor(private readonly spellChecker: SpellChecker) {}

  execute(input: CheckSpellingInput): SpellCheckResult[] {
    const accepted = new Set(input.acceptedWords ?? []);
    const misspelled: SpellCheckResult[] = [];

    for (const word of input.words) {
      if (word.length < MIN_CHECKABLE_LENGTH) continue;
      if (accepted.has(word)) continue;
      if (this.isSpelled(word)) continue;

      misspelled.push({
        word,
        suggestions: this.spellChecker.suggest(word).slice(0, MAX_SUGGESTIONS),
      });
    }

    return misspelled;
  }

  /**
   * A word starting with a capital is accepted without being looked up: proper nouns, place
   * names and sentence starts all do, and a novel is full of names no dictionary carries.
   * Flagging them would bury the real mistakes. Deliberate — see the tests.
   */
  private isSpelled(word: string): boolean {
    return (
      word[0] !== word[0].toLowerCase() ||
      this.spellChecker.correct(word) ||
      this.spellChecker.correct(word.toLowerCase())
    );
  }
}
