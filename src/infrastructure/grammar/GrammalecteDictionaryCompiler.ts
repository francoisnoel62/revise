// ABOUTME: Compiles a project's declared vocabulary into a Graphspell finite-state dictionary.
// ABOUTME: Loads the engine's builder, which ships as a browser-worker script with no module exports.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { GrammarPersonalDictionary } from '@/domain/interfaces/GrammarChecker';
import type { GrammarDictionaryCompiler } from '@/domain/interfaces/GrammarDictionaryCompiler';
import {
  personalDictionaryFlexions,
  type PersonalDictionaryEntry,
} from '@/domain/value-objects/PersonalDictionaryEntry';

type DictionaryBuilder = new (
  entries: Array<[string, string, string]>,
  stemmingCode: string,
  languageCode: string,
  languageName?: string,
  dictionaryName?: string,
  description?: string
) => { createBinaryJSON(): GrammarPersonalDictionary };

const GRAPHSPELL_DIRECTORY = join(
  'node_modules',
  '@francoisnoel62',
  'grammalecte',
  '_build',
  'nodejs',
  'fr',
  'core',
  'grammalecte',
  'graphspell'
);

// The builder logs its progress to the console line by line; a project dictionary
// holds a handful of words and its compilation is not news.
const SILENT_CONSOLE = { log: () => {} };

let builder: DictionaryBuilder | null = null;

/**
 * `dawg.js` is written for a browser worker: it declares no exports and reads
 * `require` and `helpers` as free globals. Evaluating its source with those
 * bound is the only way to reach the class from Node.
 */
function getDictionaryBuilder(): DictionaryBuilder {
  if (builder) return builder;

  const directory = join(process.cwd(), GRAPHSPELL_DIRECTORY);
  const nodeRequire = createRequire(join(process.cwd(), 'package.json'));
  const source = readFileSync(join(directory, 'dawg.js'), 'utf8');

  builder = new Function(
    'require',
    'helpers',
    'console',
    `${source}\n;return DAWG;`
  )(
    (specifier: string) => nodeRequire(join(directory, specifier)),
    nodeRequire(join(directory, 'helpers.js')),
    SILENT_CONSOLE
  ) as DictionaryBuilder;

  return builder;
}

export class GrammalecteDictionaryCompiler implements GrammarDictionaryCompiler {
  compile(entries: readonly PersonalDictionaryEntry[]): GrammarPersonalDictionary | null {
    const flexions = entries.flatMap((entry) =>
      personalDictionaryFlexions(entry).map(
        ({ label, stem, tags }): [string, string, string] => [label, stem, tags]
      )
    );

    // The builder rejects an empty lexicon, and a dictionary with nothing in it
    // would teach the engine nothing anyway.
    if (flexions.length === 0) return null;

    const DictionaryBuilder = getDictionaryBuilder();
    return new DictionaryBuilder(
      flexions,
      'S',
      'fr',
      'French',
      'Revise',
      'Vocabulaire propre au projet'
    ).createBinaryJSON();
  }
}
