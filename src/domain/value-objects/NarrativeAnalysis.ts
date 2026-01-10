// ABOUTME: Value object representing the structured output of narrative analysis
// ABOUTME: Returned by LLMProvider.generateNarrativeAnalysis()

export interface NarrativeAnalysis {
  /** Type de narrateur (1ère personne, 3ème limitée, omnisciente) */
  narratorType: string;

  /** Description de la focalisation (interne, externe, zéro) */
  focalization: string;

  /** Gestion de la temporalité (temps verbal, analepses, prolepses) */
  temporality: string;

  /** Structure des chapitres (patterns, longueur, ouverture/clôture) */
  chapterStructure: string;

  /** Voix narrative distinctive (5 points caractéristiques) */
  narrativeVoice: string[];

  /** Résumé de l'analyse */
  summary: string;
}
