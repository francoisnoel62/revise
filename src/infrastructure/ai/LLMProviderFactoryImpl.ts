// ABOUTME: Infrastructure implementation of LLMProviderFactory.
// ABOUTME: Creates concrete LLM provider instances from Provider entities.

import { Provider } from '@/domain/entities/Provider';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GoogleProvider } from './GoogleProvider';

/**
 * Factory implementation for creating LLM providers.
 * Maps Provider entity types to their concrete implementations.
 * Injects PromptRepository for accessing AI prompts.
 */
export class LLMProviderFactoryImpl implements LLMProviderFactory {
  constructor(private readonly promptRepository: PromptRepository) {}

  create(provider: Provider): LLMProvider {
    const apiKey = provider.getApiKey();
    const model = provider.getModel();

    switch (provider.getType()) {
      case 'openai':
        return new OpenAIProvider(apiKey, this.promptRepository, model);

      case 'anthropic':
        return new AnthropicProvider(apiKey, this.promptRepository, model);

      case 'google':
        return new GoogleProvider(apiKey, this.promptRepository, model);

      default:
        throw new Error(`Unsupported provider type: ${provider.getType()}`);
    }
  }
}
