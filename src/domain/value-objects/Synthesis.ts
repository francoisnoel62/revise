// ABOUTME: Value object representing synthesis analysis output
// ABOUTME: Meta-analysis aggregating all previous metadata types

export interface CharacterSummary {
  name: string;
  role: string;
  motivation: string;
  flaw: string;
  lastSituation: string;
}

export interface NarrativeDirection {
  direction: string;
  advantages: string;
  risks: string;
}

export interface Synthesis {
  /** Identité du texte (5 lignes) */
  textIdentity: string;

  /** Points forts (top 5) */
  strengths: string[];

  /** Axes d'amélioration (top 5 par priorité) */
  improvements: string[];

  /** Cohérence interne (contradictions) */
  internalCoherence: string;

  /** Charte stylistique (DO/DON'T rules) */
  stylisticCharter: string[];

  /** Résumé de l'intrigue */
  plotSummary: string;

  /** Questions ouvertes à résoudre */
  openQuestions: string[];

  /** Personnages aide-mémoire */
  characterSummaries: CharacterSummary[];

  /** Promesses au lecteur */
  readerPromises: string[];

  /** Directions narratives recommandées */
  narrativeDirections: NarrativeDirection[];

  /** Scènes à envisager */
  suggestedScenes: string[];

  /** Personnages à développer */
  charactersToDevelop: string;

  /** Alertes */
  alerts: string[];
}
