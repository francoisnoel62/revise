// ABOUTME: Infrastructure implementation of LLMProviderFactory.
// ABOUTME: Creates concrete LLM provider instances from Provider entities.

import { Provider } from '@/domain/entities/Provider';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';

/**
 * Factory implementation for creating LLM providers.
 * Maps Provider entity types to their concrete implementations.
 */
export class LLMProviderFactoryImpl implements LLMProviderFactory {
  create(provider: Provider): LLMProvider {
    const apiKey = provider.getApiKey();
    const model = provider.getModel();

    switch (provider.getType()) {
      case 'openai':
        return new OpenAIProvider(apiKey, model);

      case 'anthropic':
        return new AnthropicProvider(apiKey, model);

      case 'mistral':
        // TODO Phase 2: Implement MistralProvider
        throw new Error('Mistral provider not yet implemented');

      case 'cohere':
        // TODO Phase 2: Implement CohereProvider
        throw new Error('Cohere provider not yet implemented');

      case 'google':
        // TODO Phase 2: Implement GoogleProvider
        throw new Error('Google provider not yet implemented');

      default:
        throw new Error(`Unsupported provider type: ${provider.getType()}`);
    }
  }
}
