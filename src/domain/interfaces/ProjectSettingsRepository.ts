// ABOUTME: Repository interface for ProjectSettings persistence
// ABOUTME: Defines contract for storing and retrieving project settings with multi-tenant isolation

import { ProjectSettings } from '../entities/ProjectSettings';

/**
 * Error thrown when attempting to create project settings
 * that already exist for a given project.
 */
export class DuplicateProjectSettingsError extends Error {
  constructor(projectId: string) {
    super(`Project settings already exist for project: ${projectId}`);
    this.name = 'DuplicateProjectSettingsError';
  }
}

export interface ProjectSettingsRepository {
  /**
   * Create new project settings.
   * @param userId - Owner ID for multi-tenant isolation
   * @param settings - ProjectSettings entity to persist
   * @returns Created project settings
   */
  create(userId: string, settings: ProjectSettings): Promise<ProjectSettings>;

  /**
   * Find project settings by settings ID.
   * @param userId - Owner ID for multi-tenant isolation
   * @param settingsId - Settings ID to find
   * @returns ProjectSettings if found and owned by user, null otherwise
   */
  findById(userId: string, settingsId: string): Promise<ProjectSettings | null>;

  /**
   * Find project settings by project ID.
   * Each project has one settings entry.
   * @param userId - Owner ID for multi-tenant isolation
   * @param projectId - Project ID to find settings for
   * @returns ProjectSettings if found and owned by user, null otherwise
   */
  findByProjectId(userId: string, projectId: string): Promise<ProjectSettings | null>;

  /**
   * Update existing project settings.
   * @param userId - Owner ID for multi-tenant isolation
   * @param settings - ProjectSettings entity with updated data
   * @returns Updated project settings
   */
  update(userId: string, settings: ProjectSettings): Promise<ProjectSettings>;

  /**
   * Delete project settings.
   * @param userId - Owner ID for multi-tenant isolation
   * @param settingsId - Settings ID to delete
   */
  delete(userId: string, settingsId: string): Promise<void>;

  /**
   * Delete project settings by project ID.
   * Used when deleting a project.
   * @param userId - Owner ID for multi-tenant isolation
   * @param projectId - Project ID
   */
  deleteByProjectId(userId: string, projectId: string): Promise<void>;

  /**
   * Delete all project settings owned by a user.
   * Used for RGPD-compliant account deletion.
   * @param userId - Owner ID
   */
  deleteAllByOwner(userId: string): Promise<void>;
}
