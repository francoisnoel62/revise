// ABOUTME: Tests for OpenRouter pricing API client
// ABOUTME: Covers fetching, filtering to known providers, and mapping to ModelPricingEntry

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterPricingClient } from '../OpenRouterPricingClient';

const mockResponse = {
  data: [
    {
      id: 'anthropic/claude-opus-4.8',
      pricing: { prompt: '0.000005', completion: '0.000025', input_cache_read: '0.0000005' },
    },
    {
      id: 'openai/gpt-4o',
      pricing: { prompt: '0.0000025', completion: '0.000010', input_cache_read: '0.00000125' },
    },
    {
      id: 'google/gemini-2.5-flash',
      pricing: { prompt: '0.00000015', completion: '0.0000006', input_cache_read: '0.000000015' },
    },
    {
      id: 'cohere/command-r',
      pricing: { prompt: '0.0000005', completion: '0.0000015' },
    },
  ],
};

describe('OpenRouterPricingClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    }));
  });

  it('fetches models from OpenRouter and filters to anthropic/openai/google', async () => {
    const client = new OpenRouterPricingClient();
    const entries = await client.fetchPricingEntries();

    expect(entries).toHaveLength(3);
    const providers = entries.map((e) => e.provider);
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('google');
    expect(providers).not.toContain('cohere');
  });

  it('maps anthropic model to correct prefix and cachedInInput=false', async () => {
    const client = new OpenRouterPricingClient();
    const entries = await client.fetchPricingEntries();
    const opus = entries.find((e) => e.provider === 'anthropic');

    expect(opus).toBeDefined();
    expect(opus!.prefix).toBe('claude-opus-4');
    expect(opus!.cachedInInput).toBe(false);
    expect(opus!.inputPerM).toBeCloseTo(5.0, 4);
  });

  it('maps openai model with cachedInInput=true', async () => {
    const client = new OpenRouterPricingClient();
    const entries = await client.fetchPricingEntries();
    const gpt = entries.find((e) => e.provider === 'openai');

    expect(gpt!.cachedInInput).toBe(true);
    expect(gpt!.prefix).toBe('gpt-4o');
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const client = new OpenRouterPricingClient();
    await expect(client.fetchPricingEntries()).rejects.toThrow('OpenRouter');
  });
});
