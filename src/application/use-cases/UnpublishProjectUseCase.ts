// ABOUTME: Use case for unpublishing a project.
// ABOUTME: Removes public visibility while preserving the share token.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProjectNotFoundError } from './LoadProjectUseCase';

export interface UnpublishProjectInput {
  ownerId: string;
  projectId: string;
}

export class UnpublishProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: UnpublishProjectInput): Promise<Project> {
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    project.unpublish();

    await this.projectRepository.updateProject(input.ownerId, project);

    return project;
  }
}
