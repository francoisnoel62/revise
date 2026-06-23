// ABOUTME: Value object defining analysis categories for chapter verification
// ABOUTME: Provides type safety, validation, labels and ordering for grammar, punctuation, repetition, and style analysis

export const ANALYSIS_CATEGORIES = [
  'grammar',
  'punctuation',
  'repetition',
  'style',
] as const;

export type AnalysisCategory = (typeof ANALYSIS_CATEGORIES)[number];

export function isValidAnalysisCategory(value: string): value is AnalysisCategory {
  return ANALYSIS_CATEGORIES.includes(value as AnalysisCategory);
}

export const ANALYSIS_CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  grammar: 'Grammaire',
  punctuation: 'Ponctuation',
  repetition: 'Répétitions',
  style: 'Style',
};

export const ANALYSIS_CATEGORY_ICONS: Record<AnalysisCategory, string> = {
  grammar: 'book-text',
  punctuation: 'quote',
  repetition: 'copy',
  style: 'pen-tool',
};

export const ANALYSIS_CATEGORY_ORDER: Record<AnalysisCategory, number> = {
  grammar: 0,
  punctuation: 1,
  repetition: 2,
  style: 3,
};
