// ABOUTME: Repository interface for accessing AI prompts.
// ABOUTME: Abstracts prompt storage (files, database, etc.) from domain logic.

/**
 * Repository for accessing structured AI prompts.
 * Enables swappable implementations (file-based, database, API, etc.)
 * following Clean Architecture principles.
 */
export interface PromptRepository {
  /**
   * Get the system prompt for narrative analysis generation.
   * This prompt instructs the AI on how to analyze narrative structure,
   * focalization, temporality, and voice.
   *
   * @returns The complete narrative analysis prompt
   */
  getNarrativeAnalysisPrompt(): Promise<string>;
}
