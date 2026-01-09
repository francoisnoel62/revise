// ABOUTME: Factory interface for creating LLM providers from Provider entities.
// ABOUTME: Abstracts infrastructure concern of instantiating provider implementations.

import { Provider } from '../entities/Provider';
import { LLMProvider } from './LLMProvider';

/**
 * Factory interface for creating LLM provider instances.
 * Abstracts the infrastructure concern of mapping Provider entities
 * to their concrete LLMProvider implementations.
 */
export interface LLMProviderFactory {
  /**
   * Create an LLM provider instance from a Provider entity.
   *
   * @param provider The provider entity with configuration
   * @returns LLMProvider implementation (OpenAI, Anthropic, etc.)
   * @throws Error if provider type is unsupported
   */
  create(provider: Provider): LLMProvider;
}
