// ABOUTME: Barrel export for all analysis strategies
// ABOUTME: Provides unified access to strategy interfaces and implementations

export { AnalysisStrategy, BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

export {
  SpellingAnalysisStrategy,
  SpellingLLMClient,
  SPELLING_ANALYSIS_PROMPT,
} from './SpellingAnalysisStrategy';

export {
  GrammarAnalysisStrategy,
  GrammarLLMClient,
  GRAMMAR_ANALYSIS_PROMPT,
} from './GrammarAnalysisStrategy';

export {
  PunctuationAnalysisStrategy,
  PunctuationLLMClient,
  PUNCTUATION_ANALYSIS_PROMPT,
} from './PunctuationAnalysisStrategy';

export {
  StyleAnalysisStrategy,
  StyleLLMClient,
  STYLE_ANALYSIS_PROMPT,
} from './StyleAnalysisStrategy';

export {
  RepetitionAnalysisStrategy,
  RepetitionLLMClient,
  REPETITION_ANALYSIS_PROMPT,
} from './RepetitionAnalysisStrategy';
