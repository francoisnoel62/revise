// ABOUTME: Use case for retrieving account balance from an AI provider.
// ABOUTME: Fetches usage, credits, and renewal information when available.

import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { AccountBalance } from '@/domain/value-objects/AccountBalance';

export interface GetAccountBalanceInput {
  userId: string;
  providerId: string;
}

export class GetAccountBalanceUseCase {
  constructor(
    private providerRepository: ProviderRepository,
    private llmProviderFactory: LLMProviderFactory
  ) {}

  async execute(input: GetAccountBalanceInput): Promise<AccountBalance> {
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

    // 3. Fetch and return account balance
    return await llmProvider.getAccountBalance();
  }
}
