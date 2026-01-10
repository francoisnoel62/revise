// ABOUTME: Use case for deleting a project.
// ABOUTME: Handles project deletion with proper authorization and cascade delete of metadata.

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';

export interface DeleteProjectInput {
  ownerId: string;
  projectId: string;
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private metadataRepository?: MetadataRepository // Optional for backward compatibility
  ) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    // Delete associated metadata first (if repository provided)
    if (this.metadataRepository) {
      await this.metadataRepository.deleteByProjectId(input.ownerId, input.projectId);
    }

    // Delete project
    await this.projectRepository.deleteProject(input.ownerId, input.projectId);
  }
}
