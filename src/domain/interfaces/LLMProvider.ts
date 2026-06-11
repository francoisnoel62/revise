// ABOUTME: Domain interface defining contract for AI language model providers
// ABOUTME: Abstracts text generation to allow swappable implementations (OpenAI, Anthropic, etc.)

import { RewriteProposal } from '../value-objects/RewriteProposal';
import { WordAlternative } from '../value-objects/WordAlternative';
import { NarrativeAnalysis } from '../value-objects/NarrativeAnalysis';
import { StylisticDNA } from '../value-objects/StylisticDNA';
import { Characters } from '../value-objects/Characters';
import { Plot } from '../value-objects/Plot';
import { Worldbuilding } from '../value-objects/Worldbuilding';
import { Synthesis } from '../value-objects/Synthesis';
import { ChapterSummaries } from '../value-objects/ChapterSummaries';
import { ChapterGeneration } from '../value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '../value-objects/ChapterGenerationType';
import { ChatMessage } from '../value-objects/ChatMessage';
import { CharacterProfile } from '../value-objects/Characters';

/**
 * Test connection result.
 */
export interface ConnectionTestResult {
  valid: boolean;
  error?: string;
}

/**
 * Token usage reported by a provider for its most recent API call.
 * A field is null when the provider did not report that count.
 */
export interface TokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  /** Portion of inputTokens served from the provider's prompt cache, when reported. */
  cachedInputTokens: number | null;
}

export interface LLMProvider {
  /**
   * Generates multiple rewrite proposals for the given text
   * @param text The original text to rewrite
   * @param context Optional surrounding context for better understanding
   * @returns Promise resolving to array of exactly 3 RewriteProposal objects
   * @throws Error if generation fails or API is unavailable
   */
  generateRewrites(
    text: string,
    context?: string,
    authorProfile?: string
  ): Promise<RewriteProposal[]>;

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

  /**
   * Generates content for a new chapter based on project context.
   * Uses all available metadata and existing chapters to produce
   * contextually appropriate content matching the author's voice.
   *
   * @param fullText The complete text with all existing chapters
   * @param generationType Type of generation: beginning, full, or outline
   * @param metadata Optional project metadata for enhanced context
   * @returns Promise resolving to generated chapter content
   * @throws Error if generation fails or API is unavailable
   */
  generateChapter(
    fullText: string,
    generationType: ChapterGenerationTypeKey,
    projectContext?: string
  ): Promise<ChapterGeneration>;

  /**
   * Generates text completion for autocompletion feature.
   * Continues the text naturally based on context and author's style.
   *
   * @param textBeforeCursor Text before the cursor position (context)
   * @param textAfterCursor Optional text after cursor (for better context)
   * @param metadata Optional project metadata for style consistency
   * @returns Promise resolving to suggested completion text (1-3 sentences)
   * @throws Error if generation fails or API is unavailable
   */
  generateCompletion(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): Promise<string>;

  /**
   * Generates text completion with streaming support.
   * Yields text chunks as they are generated.
   *
   * @param textBeforeCursor Text before the cursor position (context)
   * @param textAfterCursor Optional text after cursor (for better context)
   * @param metadata Optional project metadata for style consistency
   * @returns AsyncIterator yielding text chunks
   * @throws Error if generation fails or API is unavailable
   */
  generateCompletionStream(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): AsyncIterableIterator<string>;

  /**
   * Streams a conversational reply from a character persona.
   * Yields text chunks as they are generated.
   *
   * @param messages Conversation history
   * @param systemPrompt Character persona instructions
   * @returns AsyncIterator yielding text chunks
   */
  chatStream(
    messages: ChatMessage[],
    systemPrompt: string,
  ): AsyncIterableIterator<string>;

  /**
   * Generates or completes a character sheet for the given character.
   * Uses the existing fields and project context to fill in all 8 fields.
   *
   * @param characterName The character's name
   * @param existingFields Fields already filled in (may be empty strings)
   * @param projectContext Assembled manuscript text + metadata summaries
   * @returns Promise resolving to all 8 character sheet fields
   */
  generateCharacterSheet(
    characterName: string,
    existingFields: Omit<CharacterProfile, 'name'>,
    projectContext: string
  ): Promise<Omit<CharacterProfile, 'name'>>;

  /**
   * Suggests word alternatives for the given word in its sentence context.
   * Layer 2 of the contextual thesaurus — AI-powered, scene-effect justified.
   *
   * @param word The word to find alternatives for
   * @param sentence The sentence containing the word (provides context)
   * @param authorProfile Optional author voice profile from AIContextBuilder
   * @returns Promise resolving to an array of WordAlternative (3-5 proposals)
   */
  suggestAlternatives(
    word: string,
    sentence: string,
    authorProfile?: string
  ): Promise<WordAlternative[]>;

  /**
   * Returns the token usage of the provider's most recent API call,
   * or null if no usage was reported. Used by usage-tracking decorators
   * to record real token consumption per operation.
   */
  getLastTokenUsage?(): TokenUsage | null;
}
