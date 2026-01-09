// ABOUTME: Use case for updating a project's title.
// ABOUTME: Validates project exists before updating.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface UpdateProjectTitleInput {
  ownerId: string;
  projectId: string;
  title: string;
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

export class UpdateProjectTitleUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectTitleInput): Promise<Project> {
    // 1. Load project
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    // 2. Update title (validation in entity)
    project.updateTitle(input.title);

    // 3. Persist
    await this.projectRepository.updateProject(input.ownerId, project);

    return project;
  }
}
