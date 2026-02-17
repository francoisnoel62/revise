// ABOUTME: Value object representing which manuscript analyses were used as context for an AI request
// ABOUTME: Records presence, label, color, and summary of each analysis type fed into generation

export interface AnalysisContextEntry {
  readonly typeKey: string;       // e.g., 'narrative-analysis', 'stylistic-dna'
  readonly label: string;         // e.g., 'Analyse Narrative', 'ADN Stylistique'
  readonly present: boolean;      // Was this analysis available at generation time?
  readonly summary?: string;      // First ~200 chars of the analysis content
  readonly colorCode: string;     // Hex color for visualization
}

export interface AnalysisContext {
  readonly entries: AnalysisContextEntry[];
  readonly totalAvailable: number;  // How many analyses were actually loaded
  readonly totalPossible: number;   // Total possible analyses for this operation type
}

/**
 * Canonical color codes for each analysis type.
 * Used consistently across visualization components.
 */
export const ANALYSIS_COLORS: Record<string, string> = {
  'narrative-analysis': '#8b5cf6',  // violet
  'stylistic-dna': '#3b82f6',       // blue
  'characters': '#22c55e',          // green
  'plot': '#f97316',                 // orange
  'worldbuilding': '#14b8a6',       // teal
  'chapter-summaries': '#64748b',   // slate
};

/**
 * Human-readable labels for each analysis type.
 */
export const ANALYSIS_LABELS: Record<string, string> = {
  'narrative-analysis': 'Analyse Narrative',
  'stylistic-dna': 'ADN Stylistique',
  'characters': 'Personnages',
  'plot': 'Intrigue',
  'worldbuilding': 'Univers',
  'chapter-summaries': 'Résumés chapitres',
};
