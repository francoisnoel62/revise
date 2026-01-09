// ABOUTME: Use case for testing connection to an AI provider.
// ABOUTME: Tests credentials without persisting, used before save.

import { Provider, ProviderType } from '@/domain/entities/Provider';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { ConnectionTestResult } from '@/domain/interfaces/LLMProvider';

export interface TestProviderConnectionInput {
  userId: string;
  type: ProviderType;
  apiKey: string;
  model: string;
}

export interface TestProviderConnectionOutput {
  valid: boolean;
  message: string;
}

export class TestProviderConnectionUseCase {
  constructor(
    private llmProviderFactory: LLMProviderFactory,
    private idGenerator: IdGenerator
  ) {}

  async execute(input: TestProviderConnectionInput): Promise<TestProviderConnectionOutput> {
    // 1. Create temporary provider entity for testing
    const tempProvider = Provider.create(
      this.idGenerator.generate(),
      input.userId,
      'Test Provider',
      input.type,
      input.apiKey,
      input.model
    );

    // 2. Create LLM provider instance
    const llmProvider = this.llmProviderFactory.create(tempProvider);

    // 3. Test connection
    const result: ConnectionTestResult = await llmProvider.testConnection();

    // 4. Return formatted result
    return {
      valid: result.valid,
      message: result.valid
        ? 'Connection successful'
        : result.error || 'Connection failed',
    };
  }
}
