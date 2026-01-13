// ABOUTME: Value object representing the structured output of chapter summaries analysis
// ABOUTME: Returned by LLMProvider.generateChapterSummaries()

/**
 * Summary for a single chapter.
 */
export interface ChapterSummary {
  /** Chapter number (1-based) */
  chapterNumber: number;

  /** Title of the chapter */
  chapterTitle: string;

  /** Summary of the chapter content (max 6 sentences) */
  summary: string;
}

/**
 * Complete chapter summaries analysis.
 */
export interface ChapterSummaries {
  /** List of chapter summaries in order */
  chapters: ChapterSummary[];

  /** Overall narrative arc summary */
  overallArc: string;
}
