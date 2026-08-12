// ABOUTME: Domain port for synchronous paragraph-level grammar checking.
// ABOUTME: Keeps engine-specific dictionaries and result shapes out of application code.

import type { GrammarError } from '../value-objects/GrammarError';
import type { GrammarRuleProfile } from '../value-objects/GrammarRuleProfile';

/** Opaque dictionary data produced by a grammar-engine dictionary builder. */
export type GrammarPersonalDictionary = Readonly<Record<string, unknown>>;

export interface GrammarCheckOptions {
  ruleProfile: GrammarRuleProfile;
  personalDictionary?: GrammarPersonalDictionary;
}

export interface GrammarChecker {
  checkParagraph(paragraph: string, options: GrammarCheckOptions): readonly GrammarError[];
}
