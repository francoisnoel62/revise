// ABOUTME: Use case for creating a new project.
// ABOUTME: Validates provider configuration if a provider is specified.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateProjectInput {
  ownerId: string;
  title?: string;
  providerId?: string;
}

/**
 * Error thrown when selected provider is not valid.
 */
export class InvalidProviderError extends Error {
  constructor(message: string = 'Selected provider is not valid') {
    super(message);
    this.name = 'InvalidProviderError';
  }
}

export class CreateProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private providerRepository: ProviderRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    // 1. Validate selected provider if provided (AI is optional)
    if (input.providerId) {
      const provider = await this.providerRepository.findById(
        input.ownerId,
        input.providerId
      );

      if (!provider) {
        throw new InvalidProviderError('Provider not found');
      }

      if (!provider.isValidProvider()) {
        throw new InvalidProviderError(
          'Selected provider is not valid. Please test the connection first.'
        );
      }
    }

    // 2. Create project
    const project = Project.createEmpty(
      input.ownerId,
      input.title || 'Nouveau projet',
      { idGenerator: this.idGenerator, now: new Date() },
    );

    // 3. Set provider if provided
    if (input.providerId) {
      project.setProviderId(input.providerId);
    }

    // 4. Persist
    await this.projectRepository.createProject(input.ownerId, project);

    return project;
  }
}
