// ABOUTME: Domain interface defining contract for AI language model providers
// ABOUTME: Abstracts text generation to allow swappable implementations (OpenAI, Anthropic, etc.)

import { RewriteProposal } from '../value-objects/RewriteProposal';

export interface LLMProvider {
  /**
   * Generates multiple rewrite proposals for the given text
   * @param text The original text to rewrite
   * @param context Optional surrounding context for better understanding
   * @returns Promise resolving to array of exactly 5 RewriteProposal objects
   * @throws Error if generation fails or API is unavailable
   */
  generateRewrites(text: string, context?: string): Promise<RewriteProposal[]>;
}
