// ABOUTME: Value object defining analysis categories for chapter verification
// ABOUTME: Provides type safety, validation, labels and ordering for the repetition and style analysis

export const ANALYSIS_CATEGORIES = ['repetition', 'style'] as const;

export type AnalysisCategory = (typeof ANALYSIS_CATEGORIES)[number];

export function isValidAnalysisCategory(value: string): value is AnalysisCategory {
  return ANALYSIS_CATEGORIES.includes(value as AnalysisCategory);
}

export const ANALYSIS_CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  repetition: 'Répétitions',
  style: 'Style',
};

export const ANALYSIS_CATEGORY_ICONS: Record<AnalysisCategory, string> = {
  repetition: 'copy',
  style: 'pen-tool',
};

export const ANALYSIS_CATEGORY_ORDER: Record<AnalysisCategory, number> = {
  repetition: 0,
  style: 1,
};
