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
}
