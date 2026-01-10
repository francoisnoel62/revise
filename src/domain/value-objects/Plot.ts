// ABOUTME: Value object representing plot analysis output
// ABOUTME: Scene-by-scene breakdown with structure and directions

export interface SceneBreakdown {
  chapter: string;
  location: string;
  characters: string;
  objective: string;
  conflict: string;
  outcome: string;
  function: string;
}

export interface Plot {
  /** Situation initiale */
  initialSituation: string;

  /** Élément déclencheur */
  incitingIncident: string;

  /** Enjeux */
  stakes: string;

  /** Questions dramatiques */
  dramaticQuestions: string;

  /** Conflits identifiés */
  conflicts: string;

  /** Fils narratifs (intrigue A, B, C) */
  narrativeThreads: string;

  /** Structure détectée */
  detectedStructure: string;

  /** Scène par scène */
  sceneBreakdown: SceneBreakdown[];

  /** État de l'intrigue */
  plotState: string;

  /** Directions possibles pour la suite */
  possibleDirections: string;

  /** Synthèse */
  summary: string;
}
