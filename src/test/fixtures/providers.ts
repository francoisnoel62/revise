// ABOUTME: Provider fixture factories for test data creation.
// ABOUTME: Creates AI provider instances with various configurations.

import { Provider, ProviderType } from '@/domain/entities/Provider';
import { TEST_USER_ID } from './projects';

/**
 * Create a Provider with sensible defaults.
 */
export function createTestProvider(overrides?: {
  id?: string;
  ownerId?: string;
  name?: string;
  type?: ProviderType;
  apiKey?: string;
  model?: string;
  isValid?: boolean;
  lastTested?: Date;
}): Provider {
  const defaults = {
    id: `provider-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ownerId: TEST_USER_ID,
    name: 'Test Provider',
    type: 'openai' as ProviderType,
    apiKey: 'sk-test-api-key-1234567890',
    model: 'gpt-4o',
    isValid: false,
    lastTested: undefined,
  };

  const config = { ...defaults, ...overrides };
  const provider = Provider.create(
    config.id,
    config.ownerId,
    config.name,
    config.type,
    config.apiKey,
    config.model
  );

  if (config.isValid) {
    provider.markAsValid();
  }

  if (config.lastTested) {
    provider.updateLastTested(config.lastTested);
  }

  return provider;
}

/**
 * Create a valid OpenAI provider.
 */
export function createOpenAIProvider(overrides?: {
  id?: string;
  ownerId?: string;
  name?: string;
  model?: string;
}): Provider {
  return createTestProvider({
    type: 'openai',
    name: 'OpenAI GPT-4',
    model: 'gpt-4o',
    isValid: true,
    ...overrides,
  });
}

/**
 * Create a valid Anthropic provider.
 */
export function createAnthropicProvider(overrides?: {
  id?: string;
  ownerId?: string;
  name?: string;
  model?: string;
}): Provider {
  return createTestProvider({
    type: 'anthropic',
    name: 'Anthropic Claude',
    apiKey: 'sk-ant-test-key-1234567890',
    model: 'claude-sonnet-4-5-20250929',
    isValid: true,
    ...overrides,
  });
}

/**
 * Create a provider for each supported type.
 */
export function createAllProviderTypes(ownerId = TEST_USER_ID): Provider[] {
  const types: ProviderType[] = ['openai', 'anthropic', 'mistral', 'cohere', 'google'];

  return types.map((type, index) =>
    createTestProvider({
      id: `provider-${type}-${index}`,
      ownerId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Provider`,
      type,
      model: getDefaultModel(type),
      isValid: true,
    })
  );
}

/**
 * Get default model for a provider type.
 */
export function getDefaultModel(type: ProviderType): string {
  const models: Record<ProviderType, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-5-20250929',
    mistral: 'mistral-large-latest',
    cohere: 'command-r-plus',
    google: 'gemini-pro',
  };
  return models[type];
}

/**
 * Create an invalid provider (for error testing).
 */
export function createInvalidProvider(overrides?: {
  id?: string;
  ownerId?: string;
  type?: ProviderType;
}): Provider {
  return createTestProvider({
    name: 'Invalid Provider',
    apiKey: 'invalid-api-key',
    isValid: false,
    ...overrides,
  });
}

/**
 * Serialize a Provider for use in component tests.
 */
export function serializeProvider(provider: Provider): {
  id: string;
  name: string;
  type: ProviderType;
  maskedApiKey: string;
  model: string;
  isValid: boolean;
  lastTested?: string;
  createdAt: string;
  updatedAt: string;
} {
  const apiKey = provider.getApiKey();
  const maskedApiKey = apiKey.length > 8
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : '****';

  return {
    id: provider.getId(),
    name: provider.getName(),
    type: provider.getType(),
    maskedApiKey,
    model: provider.getModel(),
    isValid: provider.isValidProvider(),
    lastTested: provider.getLastTested()?.toISOString(),
    createdAt: provider.getCreatedAt().toISOString(),
    updatedAt: provider.getUpdatedAt().toISOString(),
  };
}
