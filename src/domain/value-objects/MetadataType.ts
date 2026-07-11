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
  // Editorial annexes (front/back matter)
  'dedication': {
    key: 'dedication',
    name: 'Dédicace',
    description: 'À qui dédiez-vous ce livre ?',
    isBuiltIn: true,
  },
  'epigraph': {
    key: 'epigraph',
    name: 'Épigraphe',
    description: 'Citation en ouverture du livre',
    isBuiltIn: true,
  },
  'foreword': {
    key: 'foreword',
    name: 'Avant-propos',
    description: 'Introduction par une autre personne',
    isBuiltIn: true,
  },
  'preface': {
    key: 'preface',
    name: 'Préface',
    description: 'Votre introduction au livre',
    isBuiltIn: true,
  },
  'acknowledgments': {
    key: 'acknowledgments',
    name: 'Remerciements',
    description: 'Personnes à remercier',
    isBuiltIn: true,
  },
  'afterword': {
    key: 'afterword',
    name: 'Postface',
    description: 'Conclusion ou réflexions finales',
    isBuiltIn: true,
  },
  'about-author': {
    key: 'about-author',
    name: 'À propos de l\'auteur',
    description: 'Biographie courte',
    isBuiltIn: true,
  },
  'copyright': {
    key: 'copyright',
    name: 'Mentions légales',
    description: 'Copyright et mentions obligatoires',
    isBuiltIn: true,
  },
} as const;

export function isValidMetadataType(key: string): boolean {
  return key in METADATA_TYPES;
}

export function getMetadataType(key: string): MetadataTypeDefinition | undefined {
  return METADATA_TYPES[key];
}

/**
 * Editorial annex type keys (front/back matter content).
 * These are author-written, not AI-generated.
 */
export const EDITORIAL_TYPE_KEYS = [
  'dedication',
  'epigraph',
  'foreword',
  'acknowledgments',
  'about-author',
  'copyright',
] as const;

export type EditorialTypeKey = (typeof EDITORIAL_TYPE_KEYS)[number];

/**
 * Placeholder text for editorial types.
 */
export const EDITORIAL_PLACEHOLDERS: Record<EditorialTypeKey, string> = {
  'dedication': 'À ma famille...',
  'epigraph': '« Citation inspirante... »\n— Auteur',
  'foreword': 'Avant-propos rédigé par...',
  'acknowledgments': 'Je tiens à remercier...',
  'about-author': 'L\'auteur est...',
  'copyright': '© 2024 Nom de l\'auteur. Tous droits réservés.',
};

/**
 * Display order for editorial types (front matter first, then back matter).
 */
export const EDITORIAL_ORDER: Record<EditorialTypeKey, number> = {
  'dedication': 1,
  'epigraph': 2,
  'foreword': 3,
  'acknowledgments': 4,
  'about-author': 5,
  'copyright': 6,
};

export function isEditorialType(key: string): key is EditorialTypeKey {
  return EDITORIAL_TYPE_KEYS.includes(key as EditorialTypeKey);
}

export function getEditorialPlaceholder(key: EditorialTypeKey): string {
  return EDITORIAL_PLACEHOLDERS[key];
}

export function getEditorialOrder(key: EditorialTypeKey): number {
  return EDITORIAL_ORDER[key];
}
