// ABOUTME: Use case for deleting a project.
// ABOUTME: Handles project deletion with proper authorization and cascade delete of metadata and settings.

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';

export interface DeleteProjectInput {
  ownerId: string;
  projectId: string;
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private metadataRepository?: MetadataRepository, // Optional for backward compatibility
    private projectSettingsRepository?: ProjectSettingsRepository // Optional for backward compatibility
  ) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    // Delete associated metadata first (if repository provided)
    if (this.metadataRepository) {
      await this.metadataRepository.deleteByProjectId(input.ownerId, input.projectId);
    }

    // Delete associated project settings (if repository provided)
    if (this.projectSettingsRepository) {
      await this.projectSettingsRepository.deleteByProjectId(input.ownerId, input.projectId);
    }

    // Delete project
    await this.projectRepository.deleteProject(input.ownerId, input.projectId);
  }
}
