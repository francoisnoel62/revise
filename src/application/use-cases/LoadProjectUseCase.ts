// ABOUTME: Use case for loading a project by ID.
// ABOUTME: Ensures project exists and belongs to user.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface LoadProjectInput {
  ownerId: string;
  projectId: string;
}

/**
 * Error thrown when project is not found.
 */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

export class LoadProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: LoadProjectInput): Promise<Project> {
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    return project;
  }
}
