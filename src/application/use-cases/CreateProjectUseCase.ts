// ABOUTME: Use case for creating a new project.
// ABOUTME: Validates provider configuration before project creation.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';

export interface CreateProjectInput {
  ownerId: string;
  title?: string;
  providerId?: string;
}

/**
 * Error thrown when user has no valid providers configured.
 */
export class NoValidProvidersError extends Error {
  constructor() {
    super(
      'Vous devez configurer au moins un fournisseur IA avant de créer un projet. Rendez-vous dans "Mon profil" > "Mes fournisseurs".'
    );
    this.name = 'NoValidProvidersError';
  }
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
    private providerRepository: ProviderRepository
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    // 1. Check if user has at least one valid provider
    const providers = await this.providerRepository.listProviders(input.ownerId);
    const validProviders = providers.filter((p) => p.isValidProvider());

    if (validProviders.length === 0) {
      throw new NoValidProvidersError();
    }

    // 2. Validate selected provider if provided
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

    // 3. Create project
    const project = Project.createEmpty(
      input.ownerId,
      input.title || 'Nouveau projet'
    );

    // 4. Set provider if provided
    if (input.providerId) {
      project.setProviderId(input.providerId);
    }

    // 5. Persist
    await this.projectRepository.createProject(input.ownerId, project);

    return project;
  }
}
