// ABOUTME: Repository interface for SpellCheckCache persistence
// ABOUTME: Defines CRUD operations with multi-tenant isolation via ownerId

import { SpellCheckCache } from '../entities/SpellCheckCache';

export interface SpellCheckCacheRepository {
  /**
   * Save or update a spell check cache entry.
   * If a cache already exists for this chapter, it will be replaced.
   * @param ownerId - User ID for multi-tenant isolation
   * @param cache - The spell check cache entity to save
   */
  save(ownerId: string, cache: SpellCheckCache): Promise<void>;

  /**
   * Find spell check cache for a specific chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   * @returns The spell check cache or null if not found
   */
  findByChapterId(ownerId: string, chapterId: string): Promise<SpellCheckCache | null>;

  /**
   * Find spell check cache by ID.
   * @param ownerId - User ID for multi-tenant isolation
   * @param cacheId - The cache ID
   * @returns The spell check cache or null if not found
   */
  findById(ownerId: string, cacheId: string): Promise<SpellCheckCache | null>;

  /**
   * Delete spell check cache for a chapter.
   * @param ownerId - User ID for multi-tenant isolation
   * @param chapterId - The chapter ID
   */
  deleteByChapterId(ownerId: string, chapterId: string): Promise<void>;

  /**
   * Delete all spell check caches for a project.
   * Used when deleting a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  deleteByProjectId(ownerId: string, projectId: string): Promise<void>;

  /**
   * Delete all spell check caches owned by a user.
   * Used for RGPD account deletion.
   * @param ownerId - User ID whose caches to delete
   * @returns Number of cache entries deleted
   */
  deleteAllByOwner(ownerId: string): Promise<number>;

  /**
   * Update an existing cache entry (e.g., when applying corrections).
   * @param ownerId - User ID for multi-tenant isolation
   * @param cache - The updated spell check cache entity
   */
  update(ownerId: string, cache: SpellCheckCache): Promise<void>;
}
