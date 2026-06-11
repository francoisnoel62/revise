// ABOUTME: Tests for AI cost computation from token usage and a pricing entry
// ABOUTME: Covers known/unknown entries, cached-token discounting, and missing usage

import { describe, it, expect } from 'vitest';
import { computeCostEur } from '../ModelPricing';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

const opusEntry: ModelPricingEntry = {
  id: '1',
  provider: 'anthropic',
  prefix: 'claude-opus-4',
  inputPerM: 5.0,   // USD/M
  outputPerM: 25.0,
  cachedInputPerM: 0.5,
  cachedInInput: false,
  updatedAt: new Date(),
};

const gpt4oEntry: ModelPricingEntry = {
  id: '2',
  provider: 'openai',
  prefix: 'gpt-4o',
  inputPerM: 2.5,
  outputPerM: 10.0,
  cachedInputPerM: 1.25,
  cachedInInput: true,
  updatedAt: new Date(),
};

const EUR_USD = 1.1537;

describe('computeCostEur', () => {
  it('computes cost for an Anthropic model entry', () => {
    const cost = computeCostEur(
      { provider: 'anthropic', model: 'claude-opus-4-8', inputTokens: 1000, outputTokens: 500, cachedInputTokens: null },
      opusEntry,
      EUR_USD
    );
    // (1000 * 5 / 1e6 + 500 * 25 / 1e6) / 1.1537
    const expected = (1000 * 5 / 1_000_000 + 500 * 25 / 1_000_000) / EUR_USD;
    expect(cost).toBeCloseTo(expected, 6);
  });

  it('charges Anthropic cached tokens on top of input at the reduced rate', () => {
    const cost = computeCostEur(
      { provider: 'anthropic', model: 'claude-opus-4-8', inputTokens: 1000, outputTokens: 0, cachedInputTokens: 2000 },
      opusEntry,
      EUR_USD
    );
    // Anthropic: cachedInInput=false → full input + cached added on top
    const expected = (1000 * 5 / 1_000_000 + 2000 * 0.5 / 1_000_000) / EUR_USD;
    expect(cost).toBeCloseTo(expected, 6);
  });

  it('treats cached tokens as a subset of input for OpenAI', () => {
    const withCache = computeCostEur(
      { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 0, cachedInputTokens: 1000 },
      gpt4oEntry,
      EUR_USD
    );
    const withoutCache = computeCostEur(
      { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 0, cachedInputTokens: 0 },
      gpt4oEntry,
      EUR_USD
    );
    expect(withCache).not.toBeNull();
    expect(withoutCache).not.toBeNull();
    expect(withCache!).toBeLessThan(withoutCache!);
  });

  it('returns null when no token usage was reported', () => {
    const cost = computeCostEur(
      { provider: 'anthropic', model: 'claude-opus-4-8', inputTokens: null, outputTokens: null, cachedInputTokens: null },
      opusEntry,
      EUR_USD
    );
    expect(cost).toBeNull();
  });

  it('returns null when entry is null (unknown model)', () => {
    const cost = computeCostEur(
      { provider: 'anthropic', model: 'unknown-model', inputTokens: 100, outputTokens: 100, cachedInputTokens: null },
      null,
      EUR_USD
    );
    expect(cost).toBeNull();
  });
});
