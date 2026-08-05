// ABOUTME: Domain port compiling a project's declared vocabulary into an engine dictionary.
// ABOUTME: Lets the application build the dictionary once, on write, without knowing the engine.

import type { PersonalDictionaryEntry } from '../value-objects/PersonalDictionaryEntry';
import type { GrammarPersonalDictionary } from './GrammarChecker';

export interface GrammarDictionaryCompiler {
  /** Returns null when no entry declares a nature — there is nothing for the engine to know. */
  compile(entries: readonly PersonalDictionaryEntry[]): GrammarPersonalDictionary | null;
}
