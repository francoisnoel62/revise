// ABOUTME: Use case for creating a new AI provider configuration.
// ABOUTME: Handles provider creation with optional connection testing.

import { Provider, ProviderType } from '@/domain/entities/Provider';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateProviderInput {
  ownerId: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  model: string;
  testConnection?: boolean;
}

export class CreateProviderUseCase {
  constructor(
    private providerRepository: ProviderRepository,
    private llmProviderFactory: LLMProviderFactory,
    private idGenerator: IdGenerator
  ) {}

  async execute(input: CreateProviderInput): Promise<Provider> {
    // 1. Generate ID and create provider entity (validation happens in constructor)
    const provider = Provider.create(
      this.idGenerator.generate(),
      input.ownerId,
      input.name,
      input.type,
      input.apiKey,
      input.model
    );

    // 2. Optionally test connection before saving
    if (input.testConnection) {
      const llmProvider = this.llmProviderFactory.create(provider);
      const result = await llmProvider.testConnection();
      if (result.valid) {
        provider.markAsValid();
      }
    }

    // 3. Persist to repository
    await this.providerRepository.create(input.ownerId, provider);

    return provider;
  }
}
