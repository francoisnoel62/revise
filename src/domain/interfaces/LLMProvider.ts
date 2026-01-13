// ABOUTME: Domain interface defining contract for AI language model providers
// ABOUTME: Abstracts text generation to allow swappable implementations (OpenAI, Anthropic, etc.)

import { RewriteProposal } from '../value-objects/RewriteProposal';
import { NarrativeAnalysis } from '../value-objects/NarrativeAnalysis';
import { StylisticDNA } from '../value-objects/StylisticDNA';
import { Characters } from '../value-objects/Characters';
import { Plot } from '../value-objects/Plot';
import { Worldbuilding } from '../value-objects/Worldbuilding';
import { Synthesis } from '../value-objects/Synthesis';
import { ChapterSummaries } from '../value-objects/ChapterSummaries';

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

  /**
   * Generates a stylistic DNA analysis for the given text.
   * Analyzes register, lexicon, syntax, figures of style, tics,
   * rhythm, and writing rules.
   *
   * @param fullText The complete text to analyze
   * @returns Promise resolving to structured StylisticDNA
   * @throws Error if generation fails or API is unavailable
   */
  generateStylisticDNA(fullText: string): Promise<StylisticDNA>;

  /**
   * Generates character analysis for the given text.
   * Creates detailed profiles for each character, including relationships
   * and narrative hierarchy.
   *
   * @param fullText The complete text to analyze
   * @returns Promise resolving to structured Characters
   * @throws Error if generation fails or API is unavailable
   */
  generateCharacters(fullText: string): Promise<Characters>;

  /**
   * Generates plot analysis for the given text.
   * Analyzes story structure, conflicts, dramatic questions,
   * and provides scene-by-scene breakdown.
   *
   * @param fullText The complete text to analyze
   * @returns Promise resolving to structured Plot
   * @throws Error if generation fails or API is unavailable
   */
  generatePlot(fullText: string): Promise<Plot>;

  /**
   * Generates worldbuilding analysis for the given text.
   * Analyzes themes, symbolism, setting, atmosphere, and universe rules.
   *
   * @param fullText The complete text to analyze
   * @returns Promise resolving to structured Worldbuilding
   * @throws Error if generation fails or API is unavailable
   */
  generateWorldbuilding(fullText: string): Promise<Worldbuilding>;

  /**
   * Generates synthesis combining all previous analyses.
   * Meta-analysis providing editorial feedback and recommendations.
   * Special case: aggregates existing metadata.
   *
   * @param fullText The complete text to analyze
   * @param previousAnalyses Existing metadata analyses to aggregate
   * @returns Promise resolving to structured Synthesis
   * @throws Error if generation fails or API is unavailable
   */
  generateSynthesis(
    fullText: string,
    previousAnalyses: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
    }
  ): Promise<Synthesis>;

  /**
   * Generates chapter summaries for each chapter in the text.
   * Creates a structured summary (max 6 sentences) per chapter.
   *
   * @param fullText The complete text with chapter markers
   * @returns Promise resolving to structured ChapterSummaries
   * @throws Error if generation fails or API is unavailable
   */
  generateChapterSummaries(fullText: string): Promise<ChapterSummaries>;
}
