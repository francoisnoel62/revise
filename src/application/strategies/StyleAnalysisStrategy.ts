// ABOUTME: Strategy for detecting style issues based on configurable rigor
// ABOUTME: Uses LLM to identify passive voice, long sentences, weak verbs, etc.

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue, createAnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { AnalysisSeverity } from '../../domain/value-objects/AnalysisSeverity';
import { StyleRigor, getActiveRulesForRigor } from '../../domain/value-objects/StyleRigor';
import { BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

export interface StyleAnalysisResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: AnalysisSeverity;
    ruleId: string;
  }>;
}

export interface StyleLLMClient {
  analyzeStyle(
    content: string,
    options: { language: 'fr' | 'en'; rigor: StyleRigor; activeRules: string[] }
  ): Promise<StyleAnalysisResponse>;
}

/**
 * Strategy for detecting style issues using LLM analysis.
 *
 * Rigor levels:
 * - permissive: Passive voice >30%, sentences >50 words
 * - moderate: + frequent adverbs, repeated structures
 * - strict: + weak verbs, clichés, pleonasms
 */
export class StyleAnalysisStrategy extends BaseAnalysisStrategy {
  readonly category: AnalysisCategory = 'style';

  constructor(private readonly llmClient: StyleLLMClient) {
    super();
  }

  async *analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown> {
    if (!content || content.trim().length === 0) {
      return;
    }

    const rigor = options.styleRigor || 'moderate';
    const activeRules = getActiveRulesForRigor(rigor).map((r) => r.id);

    const response = await this.llmClient.analyzeStyle(content, {
      language: options.language,
      rigor,
      activeRules,
    });

    for (const issueData of response.issues) {
      if (this.isIgnored(issueData.originalText, options.ignoredTexts)) {
        continue;
      }

      // Style issues can have empty suggestions (just flagging the issue)
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

export const STYLE_ANALYSIS_PROMPT = `Analyze the following text for style issues based on the rigor level.

Rigor level: {rigor}
Active rules: {activeRules}

Rules to apply based on rigor:
- PERMISSIVE: excessive-passive-voice (>30%), very-long-sentences (>50 words)
- MODERATE: + frequent-adverbs (too many -ment/-ly adverbs), repeated-structures
- STRICT: + weak-verbs (être, avoir, faire, il y a), cliches, pleonasms

For each issue found, provide:
- The exact text with the style issue
- A suggested alternative (or empty string if just flagging)
- An explanation of why it's a style issue
- The position (character indices) in the text
- The surrounding context
- Severity: "warning" for style issues, "suggestion" for minor improvements
- The rule ID that triggered this issue

Important:
- Respect the author's voice - only flag clear style issues
- Don't flag intentional stylistic choices
- Consider the literary context

Respond in JSON format:
{
  "issues": [
    {
      "originalText": "string",
      "suggestion": "string",
      "explanation": "string",
      "position": { "start": number, "end": number },
      "context": "string",
      "severity": "warning" | "suggestion",
      "ruleId": "string"
    }
  ]
}

Text to analyze (in {language}):
{content}`;
