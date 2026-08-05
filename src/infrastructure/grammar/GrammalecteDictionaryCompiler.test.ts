// ABOUTME: Integration tests compiling a project's invented vocabulary with the real Graphspell builder.
// ABOUTME: Verifies the engine reads back the morphology the author declared, without mocks.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PersonalDictionaryEntry } from '@/domain/value-objects/PersonalDictionaryEntry';
import { DEFAULT_FICTION_GRAMMAR_RULE_PROFILE } from '@/domain/value-objects/GrammarRuleProfile';
import {
  DICTIONARY_BUILDER_FILES,
  GrammalecteDictionaryCompiler,
} from './GrammalecteDictionaryCompiler';
import { GrammalecteGrammarChecker } from './GrammalecteGrammarChecker';

describe('GrammalecteDictionaryCompiler', () => {
  const compiler = new GrammalecteDictionaryCompiler();
  const checker = new GrammalecteGrammarChecker();

  const check = (paragraph: string, entries: readonly PersonalDictionaryEntry[]) =>
    checker.checkParagraph(paragraph, {
      ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
      personalDictionary: compiler.compile(entries) ?? undefined,
    });

  it('compiles nothing when no word carries a declaration', () => {
    expect(compiler.compile([])).toBeNull();
    expect(compiler.compile([{ word: 'Vhardun' }])).toBeNull();
  });

  it('produces a dictionary the engine can install', () => {
    const compiled = compiler.compile([
      { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
    ]);

    expect(compiled).not.toBeNull();
    expect(compiled).toMatchObject({
      sHeader: '/grammalecte-fsa/',
      sLangCode: 'fr',
      nEntry: 1,
    });
  });

  it('detects an agreement mistake on an invented proper noun', () => {
    const errors = check('Vhardun est parti.', [
      { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
    ]);

    expect(errors.map((error) => error.ruleFamily.value)).toContain('ppas');
  });

  it('stays silent when the invented proper noun agrees', () => {
    const errors = check('Vhardun est partie.', [
      { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
    ]);

    expect(errors).toEqual([]);
  });

  it('says nothing about a word the author never described', () => {
    const errors = check('Vhardun est parti.', [{ word: 'Vhardun' }]);

    expect(errors).toEqual([]);
  });

  it('has its builder files traced for the route that declares a word', () => {
    // Read from disk, so no bundler can see them: a route that compiles without
    // naming them here deploys a function that throws on the first save.
    const config = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8');
    const routeStart = config.indexOf("'/project/[projectId]/cockpit/settings'");

    expect(routeStart).toBeGreaterThan(-1);
    const settingsRoute = config.slice(routeStart, config.indexOf('],', routeStart));
    for (const file of DICTIONARY_BUILDER_FILES) {
      expect(settingsRoute).toContain(`graphspell/${file}`);
    }
  });

  it('accepts the plural form the author declared', () => {
    const entries: readonly PersonalDictionaryEntry[] = [
      { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
    ];

    expect(check('Les krogans sont arrivés.', entries)).toEqual([]);
    expect(check('Les krogan sont arrivés.', entries).length).toBeGreaterThan(0);
  });
});
