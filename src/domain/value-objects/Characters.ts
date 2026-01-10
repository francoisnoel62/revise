// ABOUTME: Value object representing character analysis output
// ABOUTME: Includes per-character breakdown plus relational mapping

export interface CharacterProfile {
  name: string;
  identity: string;
  appearance: string;
  psychology: string;
  voiceAndLanguage: string;
  backstory: string;
  relationships: string;
  narrativeFunction: string;
  openQuestions: string;
}

export interface Characters {
  /** Liste de fiches personnages détaillées */
  characterProfiles: CharacterProfile[];

  /** Cartographie relationnelle (schéma textuel) */
  relationalMap: string;

  /** Hiérarchie narrative (ordre d'importance) */
  narrativeHierarchy: string;

  /** Synthèse générale */
  summary: string;
}
