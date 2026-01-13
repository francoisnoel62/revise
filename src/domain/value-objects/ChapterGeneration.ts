// ABOUTME: Value object representing the structured output of chapter generation
// ABOUTME: Returned by LLMProvider.generateChapter() with generated content and metadata

import { ChapterGenerationTypeKey } from './ChapterGenerationType';

/**
 * Generated chapter content from AI.
 */
export interface ChapterGeneration {
  /** Type of generation that was performed */
  generationType: ChapterGenerationTypeKey;

  /** Generated content as plain text (to be converted to TipTap JSON) */
  content: string;

  /** Optional: Key narrative events leading to this chapter (for context) */
  narrativeContext?: string;

  /** Optional: Writing suggestions for the author */
  suggestions?: string[];
}
