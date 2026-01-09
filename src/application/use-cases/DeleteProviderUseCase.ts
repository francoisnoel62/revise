// ABOUTME: Use case for deleting an AI provider configuration.
// ABOUTME: Enforces business rule: cannot delete provider used by projects.

import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';

export interface DeleteProviderInput {
  userId: string;
  providerId: string;
}

export class DeleteProviderUseCase {
  constructor(private providerRepository: ProviderRepository) {}

  async execute(input: DeleteProviderInput): Promise<void> {
    // 1. Check if provider is used by projects
    const isUsed = await this.providerRepository.isUsedByProjects(
      input.userId,
      input.providerId
    );

    if (isUsed) {
      throw new Error(
        'Cannot delete provider that is used by projects. Please change the provider for those projects first.'
      );
    }

    // 2. Delete provider
    await this.providerRepository.delete(input.userId, input.providerId);
  }
}
