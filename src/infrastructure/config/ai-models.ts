import { ProviderType } from '@/domain/entities/Provider';

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
