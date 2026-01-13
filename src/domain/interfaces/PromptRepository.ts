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

  /**
   * Get the system prompt for stylistic DNA analysis.
   * Analyzes register, syntax, figures of style, tics, and writing rules.
   *
   * @returns The complete stylistic DNA prompt
   */
  getStylisticDNAPrompt(): Promise<string>;

  /**
   * Get the system prompt for character analysis.
   * Analyzes character profiles, relationships, and narrative hierarchy.
   *
   * @returns The complete characters prompt
   */
  getCharactersPrompt(): Promise<string>;

  /**
   * Get the system prompt for plot analysis.
   * Analyzes story structure, conflicts, and scene breakdown.
   *
   * @returns The complete plot prompt
   */
  getPlotPrompt(): Promise<string>;

  /**
   * Get the system prompt for worldbuilding analysis.
   * Analyzes themes, symbolism, setting, and universe construction.
   *
   * @returns The complete worldbuilding prompt
   */
  getWorldbuildingPrompt(): Promise<string>;

  /**
   * Get the system prompt for synthesis analysis.
   * Meta-analysis aggregating all previous metadata types.
   *
   * @returns The complete synthesis prompt
   */
  getSynthesisPrompt(): Promise<string>;

  /**
   * Get the system prompt for chapter summaries generation.
   * Creates a structured summary (max 6 sentences) per chapter.
   *
   * @returns The complete chapter summaries prompt
   */
  getChapterSummariesPrompt(): Promise<string>;
}
