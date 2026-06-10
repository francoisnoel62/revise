// ABOUTME: Fetches AI model pricing from the OpenRouter public API.
// ABOUTME: Maps provider/model entries to ModelPricingEntry with USD/M token rates.

import { ModelPricingEntry, PricingProvider } from '@/domain/interfaces/ModelPricingRepository';

/** EUR/USD exchange rate used to convert USD costs to EUR at query time. Update when rate drifts significantly. */
export const EUR_USD_RATE = 1.1537;

const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';

interface OpenRouterPricing {
  prompt: string;
  completion: string;
  input_cache_read?: string;
}

interface OpenRouterModel {
  id: string;
  pricing: OpenRouterPricing;
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

const PROVIDER_PREFIXES: Record<string, PricingProvider> = {
  'anthropic/': 'anthropic',
  'openai/': 'openai',
  'google/': 'google',
};

function resolveProvider(modelId: string): PricingProvider | null {
  for (const [prefix, provider] of Object.entries(PROVIDER_PREFIXES)) {
    if (modelId.startsWith(prefix)) return provider;
  }
  return null;
}

/** Extract model prefix for startsWith matching: "anthropic/claude-opus-4.8" → "claude-opus-4" */
function resolvePrefix(modelId: string): string {
  const withoutProvider = modelId.replace(/^[^/]+\//, '');
  // Keep major version: "claude-opus-4.8" → "claude-opus-4", "gpt-4o-mini" → "gpt-4o-mini"
  return withoutProvider.replace(/\.\d+$/, '');
}

export class OpenRouterPricingClient {
  async fetchPricingEntries(): Promise<Omit<ModelPricingEntry, 'id'>[]> {
    const res = await fetch(OPENROUTER_API);
    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status}`);
    }
    const data: OpenRouterResponse = await res.json();

    const entries: Omit<ModelPricingEntry, 'id'>[] = [];

    for (const model of data.data) {
      const provider = resolveProvider(model.id);
      if (!provider) continue;

      const inputPerM = parseFloat(model.pricing.prompt) * 1_000_000;
      const outputPerM = parseFloat(model.pricing.completion) * 1_000_000;
      const cachedInputPerM = model.pricing.input_cache_read
        ? parseFloat(model.pricing.input_cache_read) * 1_000_000
        : inputPerM * 0.1;

      entries.push({
        provider,
        prefix: resolvePrefix(model.id),
        inputPerM,
        outputPerM,
        cachedInputPerM,
        cachedInInput: provider !== 'anthropic',
        updatedAt: new Date(),
      });
    }

    return entries;
  }
}
