// ABOUTME: UI-level label constants for display purposes
// ABOUTME: Mirrors domain value-object labels to maintain Clean Architecture boundaries

/**
 * Task status labels for UI display.
 */
export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

/**
 * Task priority labels for UI display.
 */
export const TASK_PRIORITY_LABELS: Record<string, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

/**
 * Contributor role options for UI.
 */
export const CONTRIBUTOR_ROLES = [
  'author',
  'editor',
  'illustrator',
  'translator',
  'proofreader',
  'beta_reader',
  'other',
] as const;

/**
 * Contributor role labels for UI display.
 */
export const CONTRIBUTOR_ROLE_LABELS: Record<string, string> = {
  author: 'Auteur',
  editor: 'Éditeur',
  illustrator: 'Illustrateur',
  translator: 'Traducteur',
  proofreader: 'Correcteur',
  beta_reader: 'Bêta-lecteur',
  other: 'Autre',
};

/**
 * AI operation type labels for UI display.
 * Mirrors domain/value-objects/AIOperationType labels.
 */
export const AI_OPERATION_LABELS: Record<string, string> = {
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
};

/**
 * Editorial type placeholders for UI display.
 */
export const EDITORIAL_PLACEHOLDERS: Record<string, string> = {
  dedication: 'À ma famille...',
  epigraph: '« Citation inspirante... »\n— Auteur',
  foreword: 'Avant-propos rédigé par...',
  preface: 'Pourquoi j\'ai écrit ce livre...',
  acknowledgments: 'Je tiens à remercier...',
  afterword: 'En écrivant ce livre...',
  'about-author': 'L\'auteur est...',
  copyright: '© 2024 Nom de l\'auteur. Tous droits réservés.',
};

/**
 * Get editorial placeholder text for a given type.
 */
export function getEditorialPlaceholder(type: string): string {
  return EDITORIAL_PLACEHOLDERS[type] ?? 'Commencez à écrire...';
}
