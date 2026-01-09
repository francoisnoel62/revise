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
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast and cost-effective model, recommended for most use cases',
      contextWindow: 128000,
      recommended: true,
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
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Most intelligent model, best for complex writing tasks',
      contextWindow: 200000,
      recommended: true,
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Previous generation top-tier model',
      contextWindow: 200000,
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and cost',
      contextWindow: 200000,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Fastest and most compact model',
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
