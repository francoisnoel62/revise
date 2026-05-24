// ABOUTME: Value object defining severity levels for analysis issues
// ABOUTME: Provides priority ordering for sorting and display styling

export const ANALYSIS_SEVERITIES = ['error', 'warning', 'suggestion'] as const;

export type AnalysisSeverity = (typeof ANALYSIS_SEVERITIES)[number];

export function isValidAnalysisSeverity(value: string): value is AnalysisSeverity {
  return ANALYSIS_SEVERITIES.includes(value as AnalysisSeverity);
}

export const ANALYSIS_SEVERITY_LABELS: Record<AnalysisSeverity, string> = {
  error: 'Erreur',
  warning: 'Attention',
  suggestion: 'Suggestion',
};

export const ANALYSIS_SEVERITY_PRIORITY: Record<AnalysisSeverity, number> = {
  error: 0,
  warning: 1,
  suggestion: 2,
};

export const ANALYSIS_SEVERITY_COLORS: Record<AnalysisSeverity, string> = {
  error: 'destructive',
  warning: 'warning',
  suggestion: 'info',
};

export function compareSeverity(a: AnalysisSeverity, b: AnalysisSeverity): number {
  return ANALYSIS_SEVERITY_PRIORITY[a] - ANALYSIS_SEVERITY_PRIORITY[b];
}
