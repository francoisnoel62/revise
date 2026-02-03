// ABOUTME: Interface defining the contract for analysis strategies
// ABOUTME: Each strategy handles one category of analysis (spelling, grammar, etc.)

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { StyleRigor } from '../../domain/value-objects/StyleRigor';

/**
 * Options passed to analysis strategies
 */
export interface AnalysisOptions {
  /** Detected language of the content (fr or en) */
  language: 'fr' | 'en';

  /** Style rigor level (only used by StyleAnalysisStrategy) */
  styleRigor?: StyleRigor;

  /** Words to exclude from repetition detection (character names, places, etc.) */
  exclusions?: string[];

  /** Previously ignored texts that should not be flagged again */
  ignoredTexts?: string[];
}

/**
 * Result yielded by streaming analysis
 */
export interface AnalysisStreamResult {
  /** The detected issue */
  issue: AnalysisIssue;

  /** Progress indicator (0-100) */
  progress?: number;
}

/**
 * Strategy interface for category-specific analysis.
 *
 * Each strategy:
 * - Handles one specific AnalysisCategory
 * - Returns issues as an async generator (for streaming support)
 * - Indicates whether it supports streaming
 *
 * Implementations should call the LLMProvider with appropriate prompts
 * and parse the response into AnalysisIssue objects.
 */
export interface AnalysisStrategy {
  /**
   * The analysis category this strategy handles
   */
  readonly category: AnalysisCategory;

  /**
   * Analyze content and yield issues as they are detected.
   *
   * @param content - The text content to analyze
   * @param options - Analysis options including language and exclusions
   * @yields AnalysisIssue objects as they are detected
   */
  analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown>;

  /**
   * Whether this strategy supports streaming results.
   * If false, all results will be returned at once at the end.
   *
   * RepetitionAnalysisStrategy returns false because it needs
   * the full text to detect cross-chapter repetitions.
   */
  supportsStreaming(): boolean;
}

/**
 * Base class providing common functionality for analysis strategies.
 * Strategies can extend this to get helper methods.
 */
export abstract class BaseAnalysisStrategy implements AnalysisStrategy {
  abstract readonly category: AnalysisCategory;

  abstract analyze(
    content: string,
    options: AnalysisOptions
  ): AsyncGenerator<AnalysisIssue, void, unknown>;

  supportsStreaming(): boolean {
    return true;
  }

  /**
   * Filter out issues for text that was previously ignored
   */
  protected isIgnored(originalText: string, ignoredTexts?: string[]): boolean {
    if (!ignoredTexts || ignoredTexts.length === 0) {
      return false;
    }
    return ignoredTexts.some(
      (ignored) => ignored.toLowerCase() === originalText.toLowerCase()
    );
  }

  /**
   * Detect the language of the content (simple heuristic)
   * Returns 'fr' if French-specific characters/words are found, 'en' otherwise
   */
  protected detectLanguage(content: string): 'fr' | 'en' {
    // French-specific patterns
    const frenchPatterns = [
      /[àâäéèêëïîôùûüç]/i,
      /\b(le|la|les|un|une|des|et|est|sont|ont|dans|pour|avec|sur|par)\b/i,
      /\b(je|tu|il|elle|nous|vous|ils|elles)\b/i,
    ];

    const frenchMatches = frenchPatterns.filter((pattern) =>
      pattern.test(content)
    ).length;

    return frenchMatches >= 2 ? 'fr' : 'en';
  }
}
