// ABOUTME: Benchmarks what the grammar engine costs on a cold process and once warm.
// ABOUTME: Separates engine construction, first parse and warm parse, so the numbers are actionable.

import { describe, it, expect, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { DEFAULT_FICTION_GRAMMAR_RULE_PROFILE } from '@/domain/value-objects/GrammarRuleProfile';
import { HIROSHIMA_BLOCKS } from '../../e2e/helpers/hiroshima-corpus';

/**
 * The engine loads rules, Graphspell dictionaries, conjugations and a thesaurus — about 25 MB
 * unpacked — on the first paragraph of a process, and `GrammalecteGrammarChecker` keeps it in a
 * module singleton. "Once per process" means once per cold instance on a serverless deployment,
 * so this is a cost the author can actually feel, not an amortised one.
 *
 * The budgets below are ceilings with room to spare, not targets. They exist so that a rule-set
 * or packaging change that multiplies the cold start turns the suite red instead of quietly
 * lengthening the wait before the first "Corriger le chapitre".
 */
const COLD_START_BUDGET_MS = 20_000;
const WARM_CHAPTER_BUDGET_MS = 5_000;

describe('Démarrage à froid du correcteur grammatical', () => {
  it('mesure le coût de la première vérification et celui d’une vérification chaude', async () => {
    // Imported here rather than at the top of the file: the 24.9 MB package is read and
    // evaluated on import, and a static import would have spent that before any timer starts.
    const importStart = performance.now();
    const { GrammalecteGrammarChecker } = await import(
      '@/infrastructure/grammar/GrammalecteGrammarChecker'
    );
    const importMs = performance.now() - importStart;

    // The engine throws where it reaches for globals its packaging does not provide in Node.
    // Count them rather than let them scroll past: a rule that dies is a rule that reports
    // nothing, and that is a recall question, not a noise question.
    let engineErrors = 0;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      engineErrors += 1;
    });

    const checker = new GrammalecteGrammarChecker();
    const options = { ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE };
    const blocks = HIROSHIMA_BLOCKS.map((block) => block.text);
    const characters = blocks.reduce((total, text) => total + text.length, 0);

    // First paragraph of the process: pays for loading everything.
    const coldStart = performance.now();
    checker.checkParagraph('Les chien de la voisine sont partis.', options);
    const coldMs = performance.now() - coldStart;

    // A full chapter, engine already loaded.
    const chapterStart = performance.now();
    const issues = blocks.reduce(
      (total, text) => total + checker.checkParagraph(text, options).length,
      0
    );
    const chapterMs = performance.now() - chapterStart;

    // The same chapter again: no loading left to pay for anywhere.
    const warmStart = performance.now();
    for (const text of blocks) checker.checkParagraph(text, options);
    const warmMs = performance.now() - warmStart;

    consoleError.mockRestore();

    console.log(
      [
        '',
        `Import du paquet (lecture + évaluation)             : ${importMs.toFixed(0)} ms`,
        `Première analyse du processus (chargement compris)  : ${coldMs.toFixed(0)} ms`,
        `→ total avant le premier signalement                : ${(importMs + coldMs).toFixed(0)} ms`,
        `Chapitre entier, ${blocks.length} blocs / ${characters} caractères : ${chapterMs.toFixed(0)} ms`,
        `Le même chapitre, moteur chaud                      : ${warmMs.toFixed(0)} ms`,
        `Signalements sur le chapitre                        : ${issues}`,
        `Erreurs internes du moteur pendant la mesure        : ${engineErrors}`,
        '',
      ].join('\n')
    );

    expect(importMs + coldMs).toBeLessThan(COLD_START_BUDGET_MS);
    expect(chapterMs + warmMs).toBeLessThan(WARM_CHAPTER_BUDGET_MS * 2);
    expect(warmMs).toBeLessThan(WARM_CHAPTER_BUDGET_MS);
    expect(issues).toBeGreaterThan(0);
  });

  /**
   * `GrammalecteGrammarChecker` decides whether to reinstall the project's dictionary by
   * comparing object identity. The settings are re-read from Mongo before every chapter check,
   * so the identity always differs and the dictionary is reinstalled — dropping the morphology
   * cache the engine had just built. This measures what that actually costs, since the answer
   * decides whether comparing by a stable key is worth doing at all.
   */
  it('mesure ce que coûte la réinstallation du dictionnaire à chaque vérification', async () => {
    const { GrammalecteGrammarChecker } = await import(
      '@/infrastructure/grammar/GrammalecteGrammarChecker'
    );
    const { GrammalecteDictionaryCompiler } = await import(
      '@/infrastructure/grammar/GrammalecteDictionaryCompiler'
    );

    const dictionary = new GrammalecteDictionaryCompiler().compile([
      { word: 'Vaucresson', nature: 'proper-noun', gender: 'epicene' },
      { word: 'Hiroshima', nature: 'proper-noun', gender: 'epicene' },
    ]);
    if (!dictionary) throw new Error('The compiler returned no dictionary to install');

    const checker = new GrammalecteGrammarChecker();
    const blocks = HIROSHIMA_BLOCKS.map((block) => block.text);
    const check = (personalDictionary: typeof dictionary) => {
      for (const text of blocks) {
        checker.checkParagraph(text, {
          ruleProfile: DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
          personalDictionary,
        });
      }
    };

    check(dictionary); // warm-up: pay the loading once, outside the measurement

    // Same object every time — the reference matches, nothing is reinstalled.
    const stableStart = performance.now();
    for (let run = 0; run < 3; run += 1) check(dictionary);
    const stableMs = (performance.now() - stableStart) / 3;

    // A fresh object each time, exactly what re-reading the settings from Mongo produces.
    const rereadStart = performance.now();
    for (let run = 0; run < 3; run += 1) check({ ...dictionary });
    const rereadMs = (performance.now() - rereadStart) / 3;

    console.log(
      [
        '',
        `Chapitre, dictionnaire à référence stable   : ${stableMs.toFixed(0)} ms`,
        `Chapitre, dictionnaire relu (réinstallé)    : ${rereadMs.toFixed(0)} ms`,
        `Surcoût de la réinstallation                : ${(rereadMs - stableMs).toFixed(0)} ms`,
        '',
      ].join('\n')
    );

    expect(rereadMs).toBeLessThan(WARM_CHAPTER_BUDGET_MS);
  });
});
