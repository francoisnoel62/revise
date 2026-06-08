// ABOUTME: Value object defining all AI operation types for usage tracking
// ABOUTME: Maps to LLMProvider methods that consume tokens

export const AI_OPERATION_TYPES = [
  'rewrite',
  'narrative_analysis',
  'stylistic_dna',
  'characters',
  'plot',
  'worldbuilding',
  'synthesis',
  'chapter_summaries',
  'chapter_generation',
  'completion',
  'character_chat',
  'character_sheet',
] as const;

export type AIOperationType = (typeof AI_OPERATION_TYPES)[number];

export function isValidAIOperationType(value: string): value is AIOperationType {
  return AI_OPERATION_TYPES.includes(value as AIOperationType);
}

export const AI_OPERATION_LABELS: Record<AIOperationType, string> = {
  rewrite: 'Réécriture',
  narrative_analysis: 'Analyse narrative',
  stylistic_dna: 'ADN stylistique',
  characters: 'Personnages',
  plot: 'Intrigue',
  worldbuilding: 'Univers',
  synthesis: 'Synthèse',
  chapter_summaries: 'Résumés chapitres',
  chapter_generation: 'Génération chapitre',
  completion: 'Autocomplétion',
  character_chat: 'Chat personnage',
  character_sheet: 'Génération fiche personnage',
};
