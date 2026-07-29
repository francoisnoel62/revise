// ABOUTME: Repository interface for Project persistence with multi-tenant support.
// ABOUTME: All methods require userId for ownership verification.

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';

/**
 * Repository interface for Project aggregate persistence.
 * All methods include userId parameter for multi-tenant isolation.
 * Implementations must filter by ownerId to prevent data leakage.
 */
export interface ProjectRepository {
  /**
   * Create a new project in the database.
   * The project's ownerId must match the provided userId.
   * @throws Error if project already exists or ownerId mismatch
   */
  createProject(userId: string, project: Project): Promise<Project>;

  /**
   * Load a project by ID, verifying ownership.
   * @returns Project if found and owned by userId, null otherwise
   */
  loadProject(userId: string, projectId: string): Promise<Project | null>;

  /**
   * List all projects owned by a user.
   * Results are sorted by updatedAt descending (most recent first).
   */
  listProjects(userId: string): Promise<Project[]>;

  /**
   * Update an existing project.
   * Only updates if userId matches project's ownerId.
   * @throws Error if project not found or not owned
   */
  updateProject(userId: string, project: Project): Promise<Project>;

  /**
   * Replace an existing project only if it has not changed since it was read.
   * Used for optimistic concurrency control (e.g. snapshot restoration): the
   * replace is atomic at the storage layer, so a concurrent write between the
   * caller's read and this call is guaranteed to be detected.
   * @param expectedUpdatedAt - The project's updatedAt at the time it was read
   * @returns true if the replace succeeded, false if the project changed (or
   *   was deleted / not owned) since expectedUpdatedAt — the caller must reload
   */
  replaceProjectIfUnchanged(
    userId: string,
    project: Project,
    expectedUpdatedAt: Date
  ): Promise<boolean>;

  /**
   * Delete a project.
   * Only deletes if userId matches project's ownerId.
   * @throws Error if project not found or not owned
   */
  deleteProject(userId: string, projectId: string): Promise<void>;

  /**
   * Update a single chapter within a project.
   * Optimized for frequent autosave operations.
   * @throws Error if project not found or not owned
   */
  updateChapter(userId: string, projectId: string, chapter: Chapter): Promise<void>;

  /**
   * Delete all projects owned by a user.
   * Used for RGPD account deletion.
   * @param userId The user whose projects to delete
   * @returns Number of projects deleted
   */
  deleteAllByOwner(userId: string): Promise<number>;

  /**
   * Find a published project by its share token.
   * Does not require authentication - used for public reading.
   * @returns Project if found, published, and token matches; null otherwise
   */
  findPublishedByToken(projectId: string, shareToken: string): Promise<Project | null>;
}
