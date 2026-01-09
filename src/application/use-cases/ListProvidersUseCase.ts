// ABOUTME: Use case for listing all AI providers for a user.
// ABOUTME: Returns providers sorted by creation date.

import { Provider } from '@/domain/entities/Provider';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';

export interface ListProvidersInput {
  userId: string;
}

export class ListProvidersUseCase {
  constructor(private providerRepository: ProviderRepository) {}

  async execute(input: ListProvidersInput): Promise<Provider[]> {
    return this.providerRepository.listProviders(input.userId);
  }
}
