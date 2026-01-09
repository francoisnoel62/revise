// ABOUTME: Use case for updating an existing AI provider configuration.
// ABOUTME: Handles partial updates with optional connection testing.

import { Provider } from '@/domain/entities/Provider';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';

export interface UpdateProviderInput {
  userId: string;
  providerId: string;
  name?: string;
  apiKey?: string;
  model?: string;
  testConnection?: boolean;
}

export class UpdateProviderUseCase {
  constructor(
    private providerRepository: ProviderRepository,
    private llmProviderFactory: LLMProviderFactory
  ) {}

  async execute(input: UpdateProviderInput): Promise<Provider> {
    // 1. Load existing provider
    const provider = await this.providerRepository.findById(
      input.userId,
      input.providerId
    );

    if (!provider) {
      throw new Error('Provider not found');
    }

    // 2. Apply updates (validation in entity methods)
    if (input.name !== undefined) {
      provider.updateName(input.name);
    }
    if (input.apiKey !== undefined) {
      provider.updateApiKey(input.apiKey);
    }
    if (input.model !== undefined) {
      provider.updateModel(input.model);
    }

    // 3. Optionally test connection
    if (input.testConnection) {
      const llmProvider = this.llmProviderFactory.create(provider);
      const result = await llmProvider.testConnection();
      if (result.valid) {
        provider.markAsValid();
      }
    }

    // 4. Persist changes
    await this.providerRepository.update(input.userId, provider);

    return provider;
  }
}
