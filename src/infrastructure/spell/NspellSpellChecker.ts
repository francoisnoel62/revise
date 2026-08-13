// ABOUTME: nspell-backed implementation of the domain spell-checking port.
// ABOUTME: Keeps the dictionary files and the engine instance inside infrastructure.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SpellChecker } from '@/domain/interfaces/SpellChecker';

interface NspellEngine {
  correct(word: string): boolean;
  suggest(word: string): string[];
}

/**
 * The promise is what gets memoised, not the engine.
 *
 * Reading and parsing the fr-FR dictionary costs seconds. Holding the instance would let two
 * concurrent callers each start a load, pay the cost twice, and keep both engines in memory
 * until the loser is collected. Holding the promise makes the second caller wait for the
 * first load instead.
 */
let loading: Promise<SpellChecker> | null = null;

export function loadNspellSpellChecker(): Promise<SpellChecker> {
  loading ??= load();
  return loading;
}

async function load(): Promise<SpellChecker> {
  // Read .aff/.dic directly rather than importing dictionary-fr, whose import.meta.url
  // Turbopack rewrites to a bundle URL that fs.readFile cannot resolve.
  const dictionaryDirectory = path.join(process.cwd(), 'node_modules', 'dictionary-fr');
  const [aff, dic] = await Promise.all([
    readFile(path.join(dictionaryDirectory, 'index.aff')),
    readFile(path.join(dictionaryDirectory, 'index.dic')),
  ]);

  const { default: Nspell } = await import('nspell');
  return new NspellSpellChecker(new Nspell({ aff, dic }) as unknown as NspellEngine);
}

export class NspellSpellChecker implements SpellChecker {
  constructor(private readonly engine: NspellEngine) {}

  correct(word: string): boolean {
    return this.engine.correct(word);
  }

  suggest(word: string): string[] {
    return this.engine.suggest(word);
  }
}
