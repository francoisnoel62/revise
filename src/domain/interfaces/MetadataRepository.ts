// ABOUTME: Repository interface for ProjectMetadata persistence
// ABOUTME: Defines CRUD operations with multi-tenant isolation via ownerId

import { ProjectMetadata } from '../entities/ProjectMetadata';

export interface MetadataRepository {
  /**
   * Create a new metadata document.
   * @param ownerId - User ID for multi-tenant isolation
   * @param metadata - The metadata entity to create
   * @returns The created metadata
   */
  create(ownerId: string, metadata: ProjectMetadata): Promise<ProjectMetadata>;

  /**
   * Find a metadata document by ID.
   * @param ownerId - User ID for multi-tenant isolation
   * @param metadataId - The metadata ID
   * @returns The metadata or null if not found
   */
  findById(ownerId: string, metadataId: string): Promise<ProjectMetadata | null>;

  /**
   * Find all metadata documents for a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @returns Array of metadata documents
   */
  findByProjectId(ownerId: string, projectId: string): Promise<ProjectMetadata[]>;

  /**
   * Find metadata by project and type.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @param typeKey - The metadata type key (e.g., 'narrative-analysis')
   * @returns The metadata or null if not found
   */
  findByProjectAndType(
    ownerId: string,
    projectId: string,
    typeKey: string
  ): Promise<ProjectMetadata | null>;

  /**
   * Update an existing metadata document.
   * @param ownerId - User ID for multi-tenant isolation
   * @param metadata - The updated metadata entity
   * @returns The updated metadata
   */
  update(ownerId: string, metadata: ProjectMetadata): Promise<ProjectMetadata>;

  /**
   * Delete a metadata document.
   * @param ownerId - User ID for multi-tenant isolation
   * @param metadataId - The metadata ID to delete
   */
  delete(ownerId: string, metadataId: string): Promise<void>;

  /**
   * Delete all metadata for a project.
   * Used when deleting a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  deleteByProjectId(ownerId: string, projectId: string): Promise<void>;
}
