// ABOUTME: Value object representing a chapter generation type (beginning, full, outline)
// ABOUTME: Defines the key, display name, and description for each generation option

export interface ChapterGenerationTypeDefinition {
  readonly key: 'chapter-beginning' | 'chapter-full' | 'chapter-outline';
  readonly name: string;
  readonly description: string;
  readonly maxWords: number;
}

/**
 * Predefined chapter generation types.
 * Each type produces different content for a new chapter.
 */
export const CHAPTER_GENERATION_TYPES: Record<string, ChapterGenerationTypeDefinition> = {
  'chapter-beginning': {
    key: 'chapter-beginning',
    name: 'Début du chapitre',
    description: 'Génère l\'ouverture du prochain chapitre (environ 10 phrases)',
    maxWords: 200,
  },
  'chapter-full': {
    key: 'chapter-full',
    name: 'Chapitre complet',
    description: 'Génère le chapitre complet (maximum 1000 mots)',
    maxWords: 1000,
  },
  'chapter-outline': {
    key: 'chapter-outline',
    name: 'Plan du chapitre',
    description: 'Génère le plan détaillé du prochain chapitre (5-9 points)',
    maxWords: 500,
  },
} as const;

export type ChapterGenerationTypeKey = keyof typeof CHAPTER_GENERATION_TYPES;

export function isValidChapterGenerationType(key: string): key is ChapterGenerationTypeKey {
  return key in CHAPTER_GENERATION_TYPES;
}

export function getChapterGenerationType(
  key: string
): ChapterGenerationTypeDefinition | undefined {
  return CHAPTER_GENERATION_TYPES[key];
}
