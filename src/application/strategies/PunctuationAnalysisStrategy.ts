// ABOUTME: Strategy for detecting punctuation errors in text
// ABOUTME: Uses LLM to identify missing/incorrect commas, periods, quotes, etc.

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue, createAnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { AnalysisSeverity } from '../../domain/value-objects/AnalysisSeverity';
import { BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

export interface PunctuationAnalysisResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: AnalysisSeverity;
  }>;
}

export interface PunctuationLLMClient {
  analyzePunctuation(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<PunctuationAnalysisResponse>;
}

/**
 * Strategy for detecting punctuation errors using LLM analysis.
 *
 * Detects:
 * - Missing commas (before conjunctions, in lists, etc.)
 * - Missing or incorrect periods
 * - Quotation mark issues (guillemets in French)
 * - Double spaces
 * - Missing spaces after punctuation
 * - Em dash vs hyphen issues
 * - Ellipsis formatting
 */
export class PunctuationAnalysisStrategy extends BaseAnalysisStrategy {
  readonly category: AnalysisCategory = 'punctuation';

  constructor(private readonly llmClient: PunctuationLLMClient) {
    super();
  }

  async *analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown> {
    if (!content || content.trim().length === 0) {
      return;
    }

    const response = await this.llmClient.analyzePunctuation(content, {
      language: options.language,
    });

    for (const issueData of response.issues) {
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

export const PUNCTUATION_ANALYSIS_PROMPT = `Analyze the following text for punctuation errors.

For each error found, provide:
- The exact text with the punctuation issue
- The corrected version
- An explanation of the rule
- The position (character indices) in the text
- The surrounding context
- Severity: "error" for definite errors, "warning" for possible issues, "suggestion" for style improvements

Focus on:
- Missing commas (before "mais", "car", "donc", "or", "ni" in French; "but", "and", "or" in English)
- Comma in lists and enumerations
- Missing periods at end of sentences
- Double spaces
- Missing spaces after punctuation
- Quotation marks (use « » for French, " " for English)
- Em dashes (—) vs hyphens (-) for dialogues
- Ellipsis (… not ...)
- Semicolon and colon usage

Language-specific rules for French:
- Space before : ; ! ? (non-breaking space)
- Guillemets « » with spaces inside
- Tiret cadratin for dialogue (—)

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
