// ABOUTME: Rule-family switches persisted with each project's grammar-checking settings.
// ABOUTME: Defines the fiction-oriented default without making it a global runtime policy.

export type GrammarRuleProfile = Readonly<Record<string, boolean>>;

/**
 * Initial profile for fiction manuscripts. A ProjectSettings instance owns a copy,
 * so authors can tune noisy rule families without affecting other projects.
 */
export const DEFAULT_FICTION_GRAMMAR_RULE_PROFILE: GrammarRuleProfile = Object.freeze({
  typo: false,
  apos: false,
  eepi: false,
  esp: true,
  tab: false,
  nbsp: true,
  tu: false,
  maj: false,
  minis: false,
  num: false,
  virg: true,
  poncfin: true,
  unit: false,
  nf: false,
  liga: false,
  mapos: false,
  chim: false,
  ocr: false,
  conf: true,
  loc: false,
  gn: true,
  infi: true,
  conj: true,
  ppas: true,
  imp: true,
  inte: true,
  vmode: true,
  bs: false,
  pleo: false,
  eleu: false,
  neg: true,
  redon1: false,
  redon2: false,
  date: false,
  mc: false,
  idrule: false,
  html: false,
  latex: false,
  md: false,
});

export function copyGrammarRuleProfile(profile: GrammarRuleProfile): Record<string, boolean> {
  return { ...profile };
}

/**
 * The families an author means by "la ponctuation": spacing, non-breaking
 * spaces, commas, and end-of-sentence marks. Microtypography (typo, apos,
 * liga) is a separate concern and stays off in fiction either way.
 */
export const PUNCTUATION_RULE_FAMILIES = ['esp', 'nbsp', 'virg', 'poncfin'] as const;

/** True only when the engine would report on every punctuation family. */
export function isPunctuationChecked(profile: GrammarRuleProfile): boolean {
  return PUNCTUATION_RULE_FAMILIES.every((family) => profile[family] === true);
}

export function withPunctuationChecked(
  profile: GrammarRuleProfile,
  checked: boolean
): Record<string, boolean> {
  const next = copyGrammarRuleProfile(profile);
  for (const family of PUNCTUATION_RULE_FAMILIES) {
    next[family] = checked;
  }
  return next;
}
