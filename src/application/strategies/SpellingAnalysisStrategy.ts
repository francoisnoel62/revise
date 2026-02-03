// ABOUTME: Strategy for detecting spelling errors in text
// ABOUTME: Uses LLM to identify misspellings and provide corrections

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue, createAnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { AnalysisSeverity } from '../../domain/value-objects/AnalysisSeverity';
import { BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

/**
 * Response structure from the LLM for spelling analysis
 */
export interface SpellingAnalysisResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: AnalysisSeverity;
  }>;
}

/**
 * Interface for the LLM client used by this strategy
 */
export interface SpellingLLMClient {
  analyzeSpelling(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<SpellingAnalysisResponse>;
}

/**
 * Strategy for detecting spelling errors using LLM analysis.
 *
 * Detects:
 * - Misspelled words
 * - Homophone confusions (à/a, sa/ça, etc.)
 * - Typographical errors
 * - Accent errors (French)
 */
export class SpellingAnalysisStrategy extends BaseAnalysisStrategy {
  readonly category: AnalysisCategory = 'spelling';

  constructor(private readonly llmClient: SpellingLLMClient) {
    super();
  }

  async *analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown> {
    // Skip empty content
    if (!content || content.trim().length === 0) {
      return;
    }

    // Call LLM for analysis
    const response = await this.llmClient.analyzeSpelling(content, {
      language: options.language,
    });

    // Yield each issue
    for (const issueData of response.issues) {
      // Skip if this text was previously ignored
      if (this.isIgnored(issueData.originalText, options.ignoredTexts)) {
        continue;
      }

      const issue = createAnalysisIssue({
        category: this.category,
        severity: issueData.severity,
        originalText: issueData.originalText,
        suggestion: issueData.suggestion,
        explanation: issueData.explanation,
        position: issueData.position,
        context: issueData.context,
      });

      yield issue;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * Prompt template for spelling analysis
 */
export const SPELLING_ANALYSIS_PROMPT = `Analyze the following text for spelling errors.

For each error found, provide:
- The exact misspelled text
- The corrected spelling
- An explanation of the error
- The position (character indices) in the text
- The surrounding context (the sentence containing the error)
- Severity: "error" for definite misspellings, "warning" for possible issues, "suggestion" for minor improvements

Focus on:
- Misspelled words
- Homophone confusions (à/a, sa/ça, ce/se, etc. in French; their/there/they're, etc. in English)
- Accent errors (especially in French: é/è/ê, etc.)
- Common typos (double letters, missing letters)

Do NOT flag:
- Proper nouns (unless obviously misspelled)
- Technical terms or neologisms
- Intentional stylistic choices

Respond in JSON format:
{
  "issues": [
    {
      "originalText": "string",
      "suggestion": "string",
      "explanation": "string",
      "position": { "start": number, "end": number },
      "context": "string",
      "severity": "error" | "warning" | "suggestion"
    }
  ]
}

Text to analyze (in {language}):
{content}`;
