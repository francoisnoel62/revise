// ABOUTME: Server action for dictionary-based spell checking using nspell + fr-FR dictionary
// ABOUTME: Returns misspelled words with correction suggestions — zero AI tokens

'use server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SpellChecker } from '@/domain/interfaces/SpellChecker';

let spellCheckerInstance: SpellChecker | null = null;

async function getSpellChecker(): Promise<SpellChecker> {
  if (spellCheckerInstance) return spellCheckerInstance;

  // Read .aff/.dic directly to avoid dictionary-fr's import.meta.url,
  // which Turbopack rewrites to a bundle URL that fs.readFile cannot resolve.
  const dictDir = path.join(process.cwd(), 'node_modules', 'dictionary-fr');
  const [aff, dic] = await Promise.all([
    readFile(path.join(dictDir, 'index.aff')),
    readFile(path.join(dictDir, 'index.dic')),
  ]);

  const { default: Nspell } = await import('nspell');
  spellCheckerInstance = new Nspell({ aff, dic }) as unknown as SpellChecker;
  return spellCheckerInstance;
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
