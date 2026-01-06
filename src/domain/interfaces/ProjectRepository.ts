// ABOUTME: Database-agnostic interface for project persistence
// ABOUTME: Defines contract for saving/loading projects (Phase 3 implementation)

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';

/**
 * Repository interface for project persistence
 * Phase 2: Mock implementation (in-memory)
 * Phase 3: Real implementation (MongoDB/PostgreSQL)
 */
export interface ProjectRepository {
  /**
   * Save entire project
   * @param project - Project to save
   * @returns Saved project (with updated timestamps, etc.)
   */
  saveProject(project: Project): Promise<Project>;

  /**
   * Load project by ID
   * @param projectId - Project identifier
   * @returns Project or null if not found
   */
  loadProject(projectId: string): Promise<Project | null>;

  /**
   * Save single chapter (optimized update)
   * @param chapter - Chapter to save
   */
  saveChapter(chapter: Chapter): Promise<void>;

  /**
   * Delete project
   * @param projectId - Project identifier
   */
  deleteProject(projectId: string): Promise<void>;
}
