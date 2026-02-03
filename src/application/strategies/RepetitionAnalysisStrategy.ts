// ABOUTME: Strategy for detecting word/phrase repetitions across the chapter
// ABOUTME: Does NOT support streaming as it needs full text for cross-reference

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue, createAnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import {
  RepetitionCluster,
  createRepetitionCluster,
} from '../../domain/value-objects/RepetitionCluster';
import { BaseAnalysisStrategy, AnalysisOptions } from './AnalysisStrategy';

export interface RepetitionAnalysisResponse {
  repetitions: Array<{
    word: string;
    count: number;
    positions: Array<{ start: number; end: number }>;
    suggestions: string[];
    isIntentional: boolean;
  }>;
}

export interface RepetitionLLMClient {
  analyzeRepetitions(
    content: string,
    options: { language: 'fr' | 'en'; exclusions: string[] }
  ): Promise<RepetitionAnalysisResponse>;
}

/**
 * Strategy for detecting word and phrase repetitions.
 *
 * This strategy does NOT support streaming because it needs
 * to analyze the entire text to detect repetitions across
 * different parts of the chapter.
 *
 * Detects:
 * - Words repeated 3+ times in the chapter
 * - Phrase repetitions
 * - Excludes intentional repetitions (character names, places)
 */
export class RepetitionAnalysisStrategy extends BaseAnalysisStrategy {
  readonly category: AnalysisCategory = 'repetition';

  private lastAnalysisResponse: RepetitionAnalysisResponse | null = null;

  constructor(private readonly llmClient: RepetitionLLMClient) {
    super();
  }

  async *analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown> {
    if (!content || content.trim().length === 0) {
      return;
    }

    const exclusions = options.exclusions || [];

    const response = await this.llmClient.analyzeRepetitions(content, {
      language: options.language,
      exclusions,
    });

    // Store for getRepetitionClusters
    this.lastAnalysisResponse = response;

    for (const repetition of response.repetitions) {
      // Skip if word is in exclusions list (case-insensitive)
      if (exclusions.some((e) => e.toLowerCase() === repetition.word.toLowerCase())) {
        continue;
      }

      // Skip if previously ignored
      if (this.isIgnored(repetition.word, options.ignoredTexts)) {
        continue;
      }

      // Create an issue for each repetition cluster
      const suggestionText =
        repetition.suggestions.length > 0
          ? `Synonymes possibles : ${repetition.suggestions.join(', ')}`
          : '';

      const explanation = `Mot "${repetition.word}" répété ${repetition.count} fois dans le chapitre.${
        suggestionText ? ' ' + suggestionText : ''
      }${repetition.isIntentional ? ' (possiblement intentionnel)' : ''}`;

      // Use the first occurrence as the main position
      const firstPosition = repetition.positions[0];

      const issue = createAnalysisIssue({
        category: this.category,
        severity: 'warning',
        originalText: repetition.word,
        suggestion: repetition.suggestions[0] || '',
        explanation,
        position: firstPosition,
        context: `Répétition détectée à ${repetition.positions.length} endroits`,
      });

      yield issue;
    }
  }

  /**
   * Repetition analysis requires the full text to detect
   * cross-chapter repetitions, so streaming is not supported.
   */
  supportsStreaming(): boolean {
    return false;
  }

  /**
   * Get the repetition clusters from the last analysis.
   * Useful for UI display of all repetition positions.
   */
  async getRepetitionClusters(
    content: string,
    options: AnalysisOptions
  ): Promise<RepetitionCluster[]> {
    const exclusions = options.exclusions || [];

    const response = await this.llmClient.analyzeRepetitions(content, {
      language: options.language,
      exclusions,
    });

    return response.repetitions
      .filter((r) => !exclusions.some((e) => e.toLowerCase() === r.word.toLowerCase()))
      .map((r) =>
        createRepetitionCluster({
          word: r.word,
          positions: r.positions,
          suggestions: r.suggestions,
          isIntentional: r.isIntentional,
        })
      );
  }
}

export const REPETITION_ANALYSIS_PROMPT = `Analyze the following text for word and phrase repetitions.

Exclusions (do not flag these): {exclusions}

For each repetition found (3+ occurrences), provide:
- The repeated word/phrase
- The total count in the text
- All positions (character indices) where it appears
- Suggested synonyms or alternatives
- Whether it seems intentional (rhetorical device, emphasis)

Focus on:
- Content words (nouns, verbs, adjectives, adverbs)
- Phrases that are repeated
- Words that could be varied for better style

Do NOT flag:
- Common function words (le, la, de, à, etc. in French; the, a, of, etc. in English)
- Words in the exclusions list (character names, place names, technical terms)
- Intentional repetitions for rhetorical effect (anaphora, etc.)

Respond in JSON format:
{
  "repetitions": [
    {
      "word": "string",
      "count": number,
      "positions": [{ "start": number, "end": number }],
      "suggestions": ["string"],
      "isIntentional": boolean
    }
  ]
}

Text to analyze (in {language}):
{content}`;
