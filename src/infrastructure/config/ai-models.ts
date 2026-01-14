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
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      description: 'Flagship model for coding and agentic tasks',
      contextWindow: 400000,
      recommended: true,
    },
    {
      id: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      description: 'Fast, cost-efficient for well-defined tasks',
      contextWindow: 400000,
    },
    {
      id: 'gpt-5-nano',
      name: 'GPT-5 Nano',
      description: 'Fastest, cheapest - ideal for summarization',
      contextWindow: 400000,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Previous generation, still very capable',
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
  ],
  google: [
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash',
      description: 'Fast reasoning with free tier and 1M context',
      contextWindow: 1000000,
      recommended: true,
    },
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      description: 'Advanced reasoning (requires billing enabled)',
      contextWindow: 1000000,
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
  google: 'Google AI',
};

/**
 * Provider setup documentation URLs.
 */
export const PROVIDER_DOCS: Record<ProviderType, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/apikey',
};
