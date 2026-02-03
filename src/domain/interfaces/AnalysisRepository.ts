// ABOUTME: Repository interface for ChapterAnalysis and AnalysisHistory persistence
// ABOUTME: Defines CRUD operations with multi-tenant isolation and caching support

import { ChapterAnalysis } from '../entities/ChapterAnalysis';
import { AnalysisHistory } from '../entities/AnalysisHistory';
import { AnalysisCategory } from '../value-objects/AnalysisCategory';

export interface IgnoredIssue {
  id: string;
  chapterId: string;
  ownerId: string;
  originalText: string;
  category: AnalysisCategory;
  ignoredAt: Date;
}

export interface RepetitionExclusionRecord {
  id: string;
  projectId: string;
  ownerId: string;
  word: string;
  reason?: string;
  createdAt: Date;
}

export interface AnalysisRepository {
  // ============================================================
  // ChapterAnalysis operations
  // ============================================================

  /**
   * Save a new chapter analysis result.
   * @param ownerId - User ID for multi-tenant isolation
   * @param analysis - The chapter analysis entity to save
   */
  saveAnalysis(ownerId: string, analysis: ChapterAnalysis): Promise<void>;

  /**
   * Find the latest analysis for a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @returns The latest analysis or null if not found
   */
  findAnalysisByChapterId(ownerId: string, chapterId: string): Promise<ChapterAnalysis | null>;

  /**
   * Find an analysis by its content hash (for caching).
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @param contentHash - SHA-256 hash of chapter content
   * @returns The cached analysis or null if not found
   */
  findAnalysisByContentHash(
    ownerId: string,
    chapterId: string,
    contentHash: string
  ): Promise<ChapterAnalysis | null>;

  /**
   * Update an existing analysis (e.g., after applying corrections).
   * @param ownerId - User ID for multi-tenant isolation
   * @param analysis - The updated analysis
   */
  updateAnalysis(ownerId: string, analysis: ChapterAnalysis): Promise<void>;

  /**
   * Delete analysis for a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param analysisId - The analysis ID to delete
   */
  deleteAnalysis(ownerId: string, analysisId: string): Promise<void>;

  // ============================================================
  // AnalysisHistory operations
  // ============================================================

  /**
   * Save an analysis history entry.
   * @param ownerId - User ID for multi-tenant isolation
   * @param history - The history entry to save
   */
  saveHistory(ownerId: string, history: AnalysisHistory): Promise<void>;

  /**
   * Find all history entries for a chapter.
   * Returns entries sorted by createdAt descending (newest first).
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @returns Array of history entries
   */
  findHistoryByChapterId(ownerId: string, chapterId: string): Promise<AnalysisHistory[]>;

  /**
   * Find a specific history entry by ID.
   * @param ownerId - User ID for multi-tenant isolation
   * @param historyId - The history ID
   * @returns The history entry or null if not found
   */
  findHistoryById(ownerId: string, historyId: string): Promise<AnalysisHistory | null>;

  /**
   * Update a history entry (e.g., after applying more corrections).
   * @param ownerId - User ID for multi-tenant isolation
   * @param history - The updated history entry
   */
  updateHistory(ownerId: string, history: AnalysisHistory): Promise<void>;

  // ============================================================
  // Ignored issues operations
  // ============================================================

  /**
   * Save an ignored issue (to prevent re-flagging).
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @param originalText - The text that was flagged
   * @param category - The analysis category
   */
  saveIgnoredIssue(
    ownerId: string,
    chapterId: string,
    originalText: string,
    category: AnalysisCategory
  ): Promise<void>;

  /**
   * Find all ignored issues for a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @returns Array of ignored issues
   */
  findIgnoredIssues(ownerId: string, chapterId: string): Promise<IgnoredIssue[]>;

  /**
   * Remove an ignored issue (allow re-flagging).
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @param originalText - The text to un-ignore
   * @param category - The analysis category
   */
  removeIgnoredIssue(
    ownerId: string,
    chapterId: string,
    originalText: string,
    category: AnalysisCategory
  ): Promise<void>;

  // ============================================================
  // Repetition exclusions operations
  // ============================================================

  /**
   * Save a word to exclude from repetition detection.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @param word - The word to exclude
   * @param reason - Optional reason (e.g., "Character name", "Technical term")
   */
  saveRepetitionExclusion(
    ownerId: string,
    projectId: string,
    word: string,
    reason?: string
  ): Promise<void>;

  /**
   * Find all repetition exclusions for a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @returns Array of exclusion records
   */
  findRepetitionExclusions(
    ownerId: string,
    projectId: string
  ): Promise<RepetitionExclusionRecord[]>;

  /**
   * Remove a repetition exclusion.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @param word - The word to remove from exclusions
   */
  removeRepetitionExclusion(
    ownerId: string,
    projectId: string,
    word: string
  ): Promise<void>;

  // ============================================================
  // Cleanup operations (for cascading deletes)
  // ============================================================

  /**
   * Delete all analysis data for a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   */
  deleteAllByChapterId(ownerId: string, chapterId: string): Promise<void>;

  /**
   * Delete all analysis data for a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  deleteAllByProjectId(ownerId: string, projectId: string): Promise<void>;

  /**
   * Delete all analysis data owned by a user.
   * Used for RGPD account deletion.
   * @param ownerId - User ID whose data to delete
   * @returns Number of records deleted
   */
  deleteAllByOwner(ownerId: string): Promise<number>;
}
