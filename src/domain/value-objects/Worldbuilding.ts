// ABOUTME: Value object representing worldbuilding analysis output
// ABOUTME: Thematic layers plus universe construction

export interface Worldbuilding {
  /** Thèmes explicites */
  explicitThemes: string;

  /** Thèmes implicites */
  implicitThemes: string;

  /** Symbolique */
  symbolism: string;

  /** Sous-texte */
  subtext: string;

  /** Vision du monde et valeurs */
  worldview: string;

  /** Intertextualité */
  intertextuality: string;

  /** Cadre spatio-temporel */
  spatiotemporalSetting: string;

  /** Atmosphère (palette sensorielle) */
  atmosphere: string;

  /** Règles du monde (fantastique/SF) */
  worldRules: string;

  /** Contexte social */
  socialContext: string;

  /** Détails d'immersion */
  immersionDetails: string;

  /** Cohérence worldbuilding */
  coherence: string;

  /** Synthèse */
  summary: string;
}
