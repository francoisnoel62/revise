// ABOUTME: Value object representing stylistic DNA analysis output
// ABOUTME: Covers register, syntax, figures, tics, rhythm, and writing rules

export interface StylisticDNA {
  /** Registre et lexique (niveau de langue, richesse, champs lexicaux) */
  registerAndLexicon: string;

  /** Syntaxe (longueur phrases, structures, ponctuation, rythme) */
  syntax: string;

  /** Figures de style (métaphores, comparaisons, procédés) */
  figuresOfStyle: string;

  /** Tics et signatures (mots récurrents, tournures, adverbes) */
  ticsAndSignatures: string;

  /** Rythme et respiration (tempo, alternance, paragraphes) */
  rhythmAndBreathing: string;

  /** Charte "À la manière de" (10 règles DO/DON'T) */
  writingRules: string[];

  /** Synthèse de l'ADN stylistique */
  summary: string;
}
