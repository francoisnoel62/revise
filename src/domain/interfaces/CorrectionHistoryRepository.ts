// ABOUTME: Repository interface for CorrectionHistory persistence
// ABOUTME: Defines CRUD operations with multi-tenant isolation via ownerId

import { CorrectionHistory } from '../entities/CorrectionHistory';

export interface CorrectionHistoryRepository {
  /**
   * Save a new correction history entry.
   * @param ownerId - User ID for multi-tenant isolation
   * @param history - The correction history entity to save
   */
  save(ownerId: string, history: CorrectionHistory): Promise<void>;

  /**
   * Find all correction history entries for a project.
   * Returns entries sorted by createdAt descending (newest first).
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @returns Array of correction history entries
   */
  findByProjectId(ownerId: string, projectId: string): Promise<CorrectionHistory[]>;

  /**
   * Find all correction history entries for a specific chapter.
   * Returns entries sorted by createdAt descending (newest first).
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @returns Array of correction history entries
   */
  findByChapterId(ownerId: string, chapterId: string): Promise<CorrectionHistory[]>;

  /**
   * Find a correction history entry by ID.
   * @param ownerId - User ID for multi-tenant isolation
   * @param historyId - The correction history ID
   * @returns The correction history or null if not found
   */
  findById(ownerId: string, historyId: string): Promise<CorrectionHistory | null>;

  /**
   * Delete a correction history entry.
   * @param ownerId - User ID for multi-tenant isolation
   * @param historyId - The correction history ID to delete
   */
  delete(ownerId: string, historyId: string): Promise<void>;

  /**
   * Delete all correction history entries for a chapter.
   * Used when deleting a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   */
  deleteByChapterId(ownerId: string, chapterId: string): Promise<void>;

  /**
   * Delete all correction history entries for a project.
   * Used when deleting a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  deleteByProjectId(ownerId: string, projectId: string): Promise<void>;

  /**
   * Delete all correction history owned by a user.
   * Used for RGPD account deletion.
   * @param ownerId - User ID whose history to delete
   * @returns Number of history entries deleted
   */
  deleteAllByOwner(ownerId: string): Promise<number>;
}
