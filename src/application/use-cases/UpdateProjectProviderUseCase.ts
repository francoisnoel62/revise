// ABOUTME: Use case for updating a project's AI provider.
// ABOUTME: Validates provider exists before updating.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';

export interface UpdateProjectProviderInput {
  ownerId: string;
  projectId: string;
  providerId: string | null;
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

/**
 * Error thrown when provider is not found.
 */
export class ProviderNotFoundError extends Error {
  constructor(providerId: string) {
    super(`Provider not found: ${providerId}`);
    this.name = 'ProviderNotFoundError';
  }
}

export class UpdateProjectProviderUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private providerRepository: ProviderRepository
  ) {}

  async execute(input: UpdateProjectProviderInput): Promise<Project> {
    // 1. Validate provider if provided
    if (input.providerId) {
      const provider = await this.providerRepository.findById(
        input.ownerId,
        input.providerId
      );

      if (!provider) {
        throw new ProviderNotFoundError(input.providerId);
      }
      // Note: We don't check isValid here - user can select invalid provider
      // and fix it later. This provides flexibility.
    }

    // 2. Load project
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    // 3. Update provider
    project.setProviderId(input.providerId);

    // 4. Persist
    await this.projectRepository.updateProject(input.ownerId, project);

    return project;
  }
}
