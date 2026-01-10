// ABOUTME: Domain interface defining contract for AI language model providers
// ABOUTME: Abstracts text generation to allow swappable implementations (OpenAI, Anthropic, etc.)

import { RewriteProposal } from '../value-objects/RewriteProposal';
import { NarrativeAnalysis } from '../value-objects/NarrativeAnalysis';

/**
 * Test connection result.
 */
export interface ConnectionTestResult {
  valid: boolean;
  error?: string;
}

export interface LLMProvider {
  /**
   * Generates multiple rewrite proposals for the given text
   * @param text The original text to rewrite
   * @param context Optional surrounding context for better understanding
   * @returns Promise resolving to array of exactly 5 RewriteProposal objects
   * @throws Error if generation fails or API is unavailable
   */
  generateRewrites(text: string, context?: string): Promise<RewriteProposal[]>;

  /**
   * Tests the connection to the provider's API.
   * Used to validate API keys before saving.
   *
   * @returns Promise resolving to test result with valid flag and optional error
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Get the provider name (e.g., "OpenAI", "Anthropic").
   *
   * @returns Provider display name
   */
  getProviderName(): string;

  /**
   * Get the model being used (e.g., "gpt-4o-mini").
   *
   * @returns Model identifier
   */
  getModel(): string;

  /**
   * Generates a narrative analysis for the given text.
   * Analyzes narrator type, focalization, temporality, chapter structure,
   * and distinctive narrative voice.
   *
   * @param fullText The complete text to analyze (all chapters combined)
   * @returns Promise resolving to structured NarrativeAnalysis
   * @throws Error if generation fails or API is unavailable
   */
  generateNarrativeAnalysis(fullText: string): Promise<NarrativeAnalysis>;
}
