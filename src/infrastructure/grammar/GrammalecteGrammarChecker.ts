// ABOUTME: Grammalecte-backed implementation of the domain grammar-checking port.
// ABOUTME: Keeps the mutable Node engine singleton and generated package inside infrastructure.

import {
  GrammarChecker as GrammalecteEngine,
  type GrammalecteError,
} from '@francoisnoel62/grammalecte';
import type {
  GrammarChecker,
  GrammarCheckOptions,
  GrammarPersonalDictionary,
} from '@/domain/interfaces/GrammarChecker';
import {
  GrammarError,
  GrammarErrorRange,
  GrammarRuleFamily,
} from '@/domain/value-objects/GrammarError';

/**
 * The engine turns on the spell checker's morphology storage, which remembers
 * what each word means for the life of the process — personal dictionary
 * included. Only `clearStorage` forgets it.
 */
type MorphologyCache = { clearStorage(): void };

let grammarEngine: GrammalecteEngine | null = null;
let installedDictionary: GrammarPersonalDictionary | null = null;

function getGrammarEngine(): GrammalecteEngine {
  if (!grammarEngine) {
    grammarEngine = new GrammalecteEngine(['Grammalecte']);
  }
  return grammarEngine;
}

export class GrammalecteGrammarChecker implements GrammarChecker {
  checkParagraph(paragraph: string, options: GrammarCheckOptions): readonly GrammarError[] {
    const engine = getGrammarEngine();
    const spellChecker = engine.getGraphspell();
    const dictionary = options.personalDictionary ?? null;

    // Grammalecte mutates a process-wide engine. Keep dictionary installation and
    // parsing synchronous and adjacent so one project's dictionary cannot leak
    // into another project's paragraph between asynchronous operations.
    if (dictionary !== installedDictionary) {
      // Words already looked up carry the previous project's morphology.
      (spellChecker as unknown as MorphologyCache).clearStorage();
      if (dictionary) {
        spellChecker.setPersonalDictionary(dictionary);
      } else {
        spellChecker.deactivatePersonalDictionary();
      }
      installedDictionary = dictionary;
    }
    engine.setGceOptions({
      ...engine.getGceDefaultOptions(),
      ...options.ruleProfile,
    });

    return engine.gramma(paragraph).map(mapGrammalecteError);
  }
}

function mapGrammalecteError(error: GrammalecteError): GrammarError {
  return new GrammarError({
    range: new GrammarErrorRange(error.nStart, error.nEnd),
    message: error.sMessage,
    suggestions: error.aSuggestions ?? [],
    ruleFamily: new GrammarRuleFamily(error.sType || error.sOption),
    ruleId: error.sRuleId,
  });
}
