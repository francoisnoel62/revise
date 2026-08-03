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
