// ABOUTME: Barrel export for all analysis strategies
// ABOUTME: Provides unified access to strategy interfaces and implementations

export type { AnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';
export { BaseAnalysisStrategy } from './AnalysisStrategy';

export { StyleAnalysisStrategy, STYLE_ANALYSIS_PROMPT } from './StyleAnalysisStrategy';
export type { StyleLLMClient } from './StyleAnalysisStrategy';

export { RepetitionAnalysisStrategy, REPETITION_ANALYSIS_PROMPT } from './RepetitionAnalysisStrategy';
export type { RepetitionLLMClient } from './RepetitionAnalysisStrategy';

export { createAnalysisStrategies } from './createAnalysisStrategies';
export type { AnalysisLLMPort } from './createAnalysisStrategies';
