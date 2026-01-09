// ABOUTME: Use case for validating an existing AI provider.
// ABOUTME: Tests connection and updates validation status in database.

import { Provider } from '@/domain/entities/Provider';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';

export interface ValidateProviderInput {
  userId: string;
  providerId: string;
}

export class ValidateProviderUseCase {
  constructor(
    private providerRepository: ProviderRepository,
    private llmProviderFactory: LLMProviderFactory
  ) {}

  async execute(input: ValidateProviderInput): Promise<Provider> {
    // 1. Load existing provider
    const provider = await this.providerRepository.findById(
      input.userId,
      input.providerId
    );

    if (!provider) {
      throw new Error('Provider not found');
    }

    // 2. Create LLM provider instance
    const llmProvider = this.llmProviderFactory.create(provider);

    // 3. Test connection
    const result = await llmProvider.testConnection();

    // 4. Update validation status
    if (result.valid) {
      provider.markAsValid();
    } else {
      provider.markAsInvalid();
    }

    // 5. Persist changes
    await this.providerRepository.update(input.userId, provider);

    return provider;
  }
}
