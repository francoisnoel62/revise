// ABOUTME: Strategy for detecting grammar errors in text
// ABOUTME: Uses LLM to identify agreement, conjugation, and syntax issues

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue, createAnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { AnalysisSeverity } from '../../domain/value-objects/AnalysisSeverity';
import { BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

export interface GrammarAnalysisResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: AnalysisSeverity;
  }>;
}

export interface GrammarLLMClient {
  analyzeGrammar(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<GrammarAnalysisResponse>;
}

/**
 * Strategy for detecting grammar errors using LLM analysis.
 *
 * Detects:
 * - Subject-verb agreement errors
 * - Noun-adjective agreement errors
 * - Conjugation errors
 * - Participle agreement (with être/avoir in French)
 * - Pronoun reference errors
 * - Syntax errors
 */
export class GrammarAnalysisStrategy extends BaseAnalysisStrategy {
  readonly category: AnalysisCategory = 'grammar';

  constructor(private readonly llmClient: GrammarLLMClient) {
    super();
  }

  async *analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown> {
    if (!content || content.trim().length === 0) {
      return;
    }

    const response = await this.llmClient.analyzeGrammar(content, {
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

export const GRAMMAR_ANALYSIS_PROMPT = `Analyze the following text for grammar errors.

For each error found, provide:
- The exact text with the error
- The corrected version
- An explanation of the grammar rule violated
- The position (character indices) in the text
- The surrounding context (the sentence containing the error)
- Severity: "error" for definite errors, "warning" for possible issues, "suggestion" for style improvements

Focus on:
- Subject-verb agreement (singular/plural)
- Noun-adjective agreement (gender and number in French)
- Verb conjugation errors (tense, person)
- Participle agreement (with être and avoir in French)
- Pronoun reference clarity
- Sentence structure issues

Do NOT flag:
- Intentional stylistic choices
- Dialogue that reflects character speech patterns
- Informal register in appropriate contexts

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
