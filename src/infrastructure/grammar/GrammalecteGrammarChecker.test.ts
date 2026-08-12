// ABOUTME: Integration tests for the real private Grammalecte Node package.
// ABOUTME: Verifies engine result mapping and project-owned rule-family switches without mocks.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
  withPunctuationChecked,
} from '@/domain/value-objects/GrammarRuleProfile';
import { getGrammarChecker } from '@/infrastructure/config/providers';
import { GrammalecteDictionaryCompiler } from './GrammalecteDictionaryCompiler';
import { GrammalecteGrammarChecker } from './GrammalecteGrammarChecker';

describe('GrammalecteGrammarChecker', () => {
  const checker = new GrammalecteGrammarChecker();
  // Git stores the corpora with LF, but a checkout under core.autocrlf writes them with CRLF.
  // Splitting on a hard-coded '\n' then yields one giant paragraph instead of fifteen, which
  // silently guts both corpus thresholds below — so accept either line ending.
  const checkFixture = (fixtureName: string) =>
    readFileSync(resolve(process.cwd(), 'src/infrastructure/grammar/fixtures', fixtureName), 'utf8')
      .trim()
      .split(/\r?\n\r?\n---\r?\n\r?\n/);

  it('maps an agreement error from the real French engine', () => {
    const errors = checker.checkParagraph('Les chien de la voisine sont partis.', {
      ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
    });

    expect(errors).toContainEqual(
      expect.objectContaining({
        range: expect.objectContaining({ start: 4, end: 9 }),
        ruleFamily: expect.objectContaining({ value: 'gn' }),
        ruleId: 'g3__gn_les_1m__b3_a1_1',
      }),
    );
  });

  it('uses the supplied project profile for the current paragraph', () => {
    const errors = checker.checkParagraph('Les chien de la voisine sont partis.', {
      ruleProfile: {
        ...DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
        gn: false,
      },
    });

    expect(errors.map((error) => error.ruleFamily.value)).not.toContain('gn');
  });

  it('is composed once for the server process', () => {
    expect(getGrammarChecker()).toBeInstanceOf(GrammalecteGrammarChecker);
    expect(getGrammarChecker()).toBe(getGrammarChecker());
  });

  it('installs the dictionary and parses without ever suspending in between', () => {
    // The whole adapter, not just checkParagraph: an await moved into a helper it
    // calls would suspend just the same, and would let another project's request
    // install its own dictionary into the shared engine mid-paragraph.
    const source = readFileSync(
      resolve(process.cwd(), 'src/infrastructure/grammar/GrammalecteGrammarChecker.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/\bawait\b/);
    expect(source).not.toMatch(/\basync\b/);
  });

  it('keeps one project vocabulary out of another project paragraph', () => {
    const dictionary = new GrammalecteDictionaryCompiler().compile([
      { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
    ]);

    // A project that declared Vhardun feminine gets the disagreement flagged...
    expect(
      checker.checkParagraph('Vhardun est parti.', {
        ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
        personalDictionary: dictionary ?? undefined,
      })
    ).not.toEqual([]);

    // ...but the next project, which never heard of the word, must not.
    expect(
      checker.checkParagraph('Vhardun est parti.', {
        ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
      })
    ).toEqual([]);
  });

  it('goes quiet on punctuation once the author switches it off', () => {
    // A double space and a question mark with no narrow space before it.
    const faulty = 'Elle entra  puis demanda : « Vraiment?  »';

    const withPunctuation = checker.checkParagraph(faulty, {
      ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
    });
    const withoutPunctuation = checker.checkParagraph(faulty, {
      ruleProfile: withPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, false),
    });

    expect(withPunctuation.length).toBeGreaterThan(0);
    expect(withoutPunctuation).toEqual([]);
  });

  it('keeps checking agreement when punctuation is switched off', () => {
    const errors = checker.checkParagraph('Les chien de la voisine sont partis.', {
      ruleProfile: withPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, false),
    });

    expect(errors.map((error) => error.ruleFamily.value)).toContain('gn');
  });

  it('reports no false positives in the clean fiction corpus', () => {
    const results = checkFixture('fiction-clean.txt').map((paragraph) =>
      checker.checkParagraph(paragraph, {
        ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
      }),
    );

    expect(results).toEqual(Array.from({ length: 15 }, () => []));
  });

  it('detects grammar mistakes in at least 12 excerpts of the faulty fiction corpus', () => {
    const detectedExcerpts = checkFixture('fiction-errors.txt').filter(
      (paragraph) =>
        checker.checkParagraph(paragraph, {
          ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
        }).length > 0,
    );

    expect(detectedExcerpts.length).toBeGreaterThanOrEqual(12);
  });
});
