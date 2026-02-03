// ABOUTME: Barrel export for all analysis strategies
// ABOUTME: Provides unified access to strategy interfaces and implementations

export type { AnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';
export { BaseAnalysisStrategy } from './AnalysisStrategy';

export { SpellingAnalysisStrategy, SPELLING_ANALYSIS_PROMPT } from './SpellingAnalysisStrategy';
export type { SpellingLLMClient } from './SpellingAnalysisStrategy';

export { GrammarAnalysisStrategy, GRAMMAR_ANALYSIS_PROMPT } from './GrammarAnalysisStrategy';
export type { GrammarLLMClient } from './GrammarAnalysisStrategy';

export { PunctuationAnalysisStrategy, PUNCTUATION_ANALYSIS_PROMPT } from './PunctuationAnalysisStrategy';
export type { PunctuationLLMClient } from './PunctuationAnalysisStrategy';

export { StyleAnalysisStrategy, STYLE_ANALYSIS_PROMPT } from './StyleAnalysisStrategy';
export type { StyleLLMClient } from './StyleAnalysisStrategy';

export { RepetitionAnalysisStrategy, REPETITION_ANALYSIS_PROMPT } from './RepetitionAnalysisStrategy';
export type { RepetitionLLMClient } from './RepetitionAnalysisStrategy';
