import { ProviderType } from '@/domain/entities/Provider';

/**
 * AI Model configuration.
 * Defines available models for each provider type.
 */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  recommended?: boolean;
}

/**
 * Model configurations for each provider.
 * Only includes models tested and supported by Revise.
 */
export const AI_MODELS: Record<ProviderType, ModelInfo[]> = {
  openai: [
    {
      id: 'gpt-5-nano-2025-08-07',
      name: 'GPT-5 Nano',
      description: 'Latest GPT-5 generation, fast with 400K context and 128K output tokens',
      contextWindow: 400000,
      recommended: true,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast and cost-effective model for most use cases',
      contextWindow: 128000,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most capable model with superior writing quality',
      contextWindow: 128000,
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Previous generation high-performance model',
      contextWindow: 128000,
    },
  ],
  anthropic: [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Smart model for complex agents and coding with exceptional performance',
      contextWindow: 200000,
      recommended: true,
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      description: 'Fastest model with near-frontier intelligence',
      contextWindow: 200000,
    },
    {
      id: 'claude-opus-4-5-20251101',
      name: 'Claude Opus 4.5',
      description: 'Premium model combining maximum intelligence with practical performance',
      contextWindow: 200000,
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4 (Legacy)',
      description: 'Previous generation high-performance model',
      contextWindow: 200000,
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet (Legacy)',
      description: 'Legacy model with 200K context',
      contextWindow: 200000,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku (Legacy)',
      description: 'Fast legacy model',
      contextWindow: 200000,
    },
  ],
  mistral: [
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      description: 'Most capable Mistral model for complex tasks',
      contextWindow: 128000,
      recommended: true,
    },
    {
      id: 'mistral-medium-latest',
      name: 'Mistral Medium',
      description: 'Balanced performance for general use',
      contextWindow: 32000,
    },
    {
      id: 'mistral-small-latest',
      name: 'Mistral Small',
      description: 'Fast and cost-effective',
      contextWindow: 32000,
    },
  ],
  cohere: [
    {
      id: 'command-r-plus',
      name: 'Command R+',
      description: 'Most capable Cohere model for advanced writing',
      contextWindow: 128000,
      recommended: true,
    },
    {
      id: 'command-r',
      name: 'Command R',
      description: 'Balanced performance for general tasks',
      contextWindow: 128000,
    },
    {
      id: 'command',
      name: 'Command',
      description: 'Previous generation model',
      contextWindow: 4096,
    },
  ],
  google: [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable Google model with extensive context',
      contextWindow: 2000000,
      recommended: true,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and efficient for quick tasks',
      contextWindow: 1000000,
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Previous generation model',
      contextWindow: 32000,
    },
  ],
};

/**
 * Get models for a specific provider type.
 * @param type Provider type
 * @returns Array of available models
 */
export function getModelsForProvider(type: ProviderType): ModelInfo[] {
  return AI_MODELS[type] || [];
}

/**
 * Get default model for a provider type.
 * Returns the recommended model, or first model if no recommendation.
 * @param type Provider type
 * @returns Default model ID
 */
export function getDefaultModel(type: ProviderType): string {
  const models = getModelsForProvider(type);
  const recommended = models.find((m) => m.recommended);
  return recommended?.id || models[0]?.id || '';
}

/**
 * Get model info by ID and provider type.
 * @param type Provider type
 * @param modelId Model ID
 * @returns Model info or undefined
 */
export function getModelInfo(
  type: ProviderType,
  modelId: string
): ModelInfo | undefined {
  const models = getModelsForProvider(type);
  return models.find((m) => m.id === modelId);
}

/**
 * Provider display names.
 */
export const PROVIDER_NAMES: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  mistral: 'Mistral AI',
  cohere: 'Cohere',
  google: 'Google AI',
};

/**
 * Provider setup documentation URLs.
 */
export const PROVIDER_DOCS: Record<ProviderType, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  mistral: 'https://console.mistral.ai/api-keys',
  cohere: 'https://dashboard.cohere.com/api-keys',
  google: 'https://makersuite.google.com/app/apikey',
};
