// ABOUTME: Use case for loading a published project via share token.
// ABOUTME: Does not require authentication - used for public reading.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface LoadPublishedProjectInput {
  projectId: string;
  shareToken: string;
}

/**
 * Error thrown when published project is not found or token is invalid.
 */
export class PublishedProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Published project not found or invalid token: ${projectId}`);
    this.name = 'PublishedProjectNotFoundError';
  }
}

export class LoadPublishedProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: LoadPublishedProjectInput): Promise<Project> {
    const project = await this.projectRepository.findPublishedByToken(
      input.projectId,
      input.shareToken
    );

    if (!project) {
      throw new PublishedProjectNotFoundError(input.projectId);
    }

    return project;
  }
}
