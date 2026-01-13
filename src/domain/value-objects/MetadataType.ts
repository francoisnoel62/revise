// ABOUTME: Value object representing a metadata type (e.g., 'narrative-analysis')
// ABOUTME: Defines the key, display name, and description for each type

export interface MetadataTypeDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly isBuiltIn: boolean;
}

/**
 * Predefined metadata types for MVP.
 * Only 'narrative-analysis' is implemented in MVP.
 */
export const METADATA_TYPES: Record<string, MetadataTypeDefinition> = {
  'narrative-analysis': {
    key: 'narrative-analysis',
    name: 'Analyse Narrative',
    description: 'Point de vue, structure narrative, temporalité, voix',
    isBuiltIn: true,
  },
  'stylistic-dna': {
    key: 'stylistic-dna',
    name: 'ADN Stylistique',
    description: 'Registre, syntaxe, figures, tics, rythme, règles d\'écriture',
    isBuiltIn: true,
  },
  'characters': {
    key: 'characters',
    name: 'Personnages',
    description: 'Fiches personnages, relations, hiérarchie narrative',
    isBuiltIn: true,
  },
  'plot': {
    key: 'plot',
    name: 'Intrigue',
    description: 'Structure, enjeux, conflits, scène par scène',
    isBuiltIn: true,
  },
  'worldbuilding': {
    key: 'worldbuilding',
    name: 'Univers',
    description: 'Thèmes, symbolique, worldbuilding, contexte social',
    isBuiltIn: true,
  },
  'synthesis': {
    key: 'synthesis',
    name: 'Synthèse',
    description: 'Analyse éditoriale globale et recommandations',
    isBuiltIn: true,
  },
  'chapter-summaries': {
    key: 'chapter-summaries',
    name: 'Résumés des Chapitres',
    description: 'Résumé structuré de chaque chapitre (max 6 phrases)',
    isBuiltIn: true,
  },
} as const;

export function isValidMetadataType(key: string): boolean {
  return key in METADATA_TYPES;
}

export function getMetadataType(key: string): MetadataTypeDefinition | undefined {
  return METADATA_TYPES[key];
}
