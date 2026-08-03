// ABOUTME: Grammalecte-backed implementation of the domain grammar-checking port.
// ABOUTME: Keeps the mutable Node engine singleton and generated package inside infrastructure.

import {
  GrammarChecker as GrammalecteEngine,
  type GrammalecteError,
} from '@francoisnoel62/grammalecte';
import type {
  GrammarChecker,
  GrammarCheckOptions,
} from '@/domain/interfaces/GrammarChecker';
import {
  GrammarError,
  GrammarErrorRange,
  GrammarRuleFamily,
} from '@/domain/value-objects/GrammarError';

let grammarEngine: GrammalecteEngine | null = null;

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

    // Grammalecte mutates a process-wide engine. Keep dictionary installation and
    // parsing synchronous and adjacent so one project's dictionary cannot leak
    // into another project's paragraph between asynchronous operations.
    if (options.personalDictionary) {
      spellChecker.setPersonalDictionary(options.personalDictionary);
    } else {
      spellChecker.deactivatePersonalDictionary();
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
