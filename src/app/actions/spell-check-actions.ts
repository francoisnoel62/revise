// ABOUTME: Server action for dictionary-based spell checking using nspell + fr-FR dictionary
// ABOUTME: Returns misspelled words with correction suggestions — zero AI tokens

'use server';

import type { SpellChecker } from '@/domain/interfaces/SpellChecker';

let spellCheckerInstance: SpellChecker | null = null;

async function getSpellChecker(): Promise<SpellChecker> {
  if (spellCheckerInstance) return spellCheckerInstance;

  const [{ default: Nspell }, { default: fr }] = await Promise.all([
    import('nspell'),
    import('dictionary-fr'),
  ]);

  const spell: SpellChecker = await new Promise((resolve, reject) => {
    fr((err: Error | null, dict: { aff: Buffer; dic: Buffer }) => {
      if (err) reject(err);
      else resolve(new Nspell(dict) as unknown as SpellChecker);
    });
  });

  spellCheckerInstance = spell;
  return spell;
}

export interface SpellCheckWordResult {
  word: string;
  suggestions: string[];
}

/**
 * Checks a list of unique words against the French dictionary.
 * Words starting with an uppercase letter are checked case-insensitively
 * to avoid flagging proper nouns and sentence-initial words.
 */
export async function checkSpellingAction(
  words: string[]
): Promise<SpellCheckWordResult[]> {
  if (words.length === 0) return [];

  const spell = await getSpellChecker();
  const misspelled: SpellCheckWordResult[] = [];

  for (const word of words) {
    if (word.length < 2) continue;

    const isCorrect =
      spell.correct(word) ||
      // Accept words that are correct when lowercased (proper nouns, sentence starts)
      spell.correct(word.toLowerCase());

    if (!isCorrect) {
      misspelled.push({
        word,
        suggestions: spell.suggest(word).slice(0, 5),
      });
    }
  }

  return misspelled;
}
