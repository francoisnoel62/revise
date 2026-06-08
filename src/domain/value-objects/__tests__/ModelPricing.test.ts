// ABOUTME: Tests for AI cost computation from token usage and the model pricing table
// ABOUTME: Covers known/unknown models, cached-token discounting, and missing usage

import { describe, it, expect } from 'vitest';
import { computeCostEur } from '../ModelPricing';

describe('computeCostEur', () => {
  it('computes cost for a known Anthropic model', () => {
    // Opus seed: 5 €/M input, 25 €/M output → 1000 in + 500 out
    const cost = computeCostEur({
      provider: 'Anthropic',
      model: 'claude-opus-4-8',
      inputTokens: 1000,
      outputTokens: 500,
      cachedInputTokens: null,
    });

    expect(cost).toBeCloseTo(0.005 + 0.0125, 6);
  });

  it('charges Anthropic cached tokens on top of input at the reduced rate', () => {
    // Anthropic input_tokens excludes cache_read, so cached is billed in addition
    const cost = computeCostEur({
      provider: 'Anthropic',
      model: 'claude-opus-4-8',
      inputTokens: 1000,
      outputTokens: 0,
      cachedInputTokens: 2000,
    });

    // 1000/1e6*5 + 2000/1e6*0.5 = 0.005 + 0.001
    expect(cost).toBeCloseTo(0.006, 6);
  });

  it('treats cached tokens as a subset of input for OpenAI', () => {
    // OpenAI prompt_tokens includes cached_tokens, so cached is discounted, not added
    const withCache = computeCostEur({
      provider: 'OpenAI',
      model: 'gpt-4o',
      inputTokens: 1000,
      outputTokens: 0,
      cachedInputTokens: 1000,
    });
    const withoutCache = computeCostEur({
      provider: 'OpenAI',
      model: 'gpt-4o',
      inputTokens: 1000,
      outputTokens: 0,
      cachedInputTokens: 0,
    });

    expect(withCache).not.toBeNull();
    expect(withoutCache).not.toBeNull();
    // Fully-cached input must cost less than fully-uncached input
    expect(withCache!).toBeLessThan(withoutCache!);
  });

  it('returns null for an unknown provider or model', () => {
    expect(
      computeCostEur({
        provider: 'Unknown',
        model: 'whatever',
        inputTokens: 100,
        outputTokens: 100,
        cachedInputTokens: null,
      })
    ).toBeNull();

    expect(
      computeCostEur({
        provider: 'Anthropic',
        model: 'mystery-model',
        inputTokens: 100,
        outputTokens: 100,
        cachedInputTokens: null,
      })
    ).toBeNull();
  });

  it('returns null when no token usage was reported', () => {
    expect(
      computeCostEur({
        provider: 'Anthropic',
        model: 'claude-opus-4-8',
        inputTokens: null,
        outputTokens: null,
        cachedInputTokens: null,
      })
    ).toBeNull();
  });
});
