// ABOUTME: Tests for GenerationParameters value object
// ABOUTME: Verifies parameter structure for AI generation configuration

import { describe, it, expect } from 'vitest';
import { GenerationParameters } from './GenerationParameters';

describe('GenerationParameters', () => {
  it('should represent parameters with extended thinking enabled', () => {
    const params: GenerationParameters = {
      temperature: null,
      maxTokens: 4096,
      thinkingBudget: 6144,
      thinkingEnabled: true,
    };

    expect(params.temperature).toBeNull();
    expect(params.maxTokens).toBe(4096);
    expect(params.thinkingBudget).toBe(6144);
    expect(params.thinkingEnabled).toBe(true);
  });

  it('should represent parameters with temperature and no thinking', () => {
    const params: GenerationParameters = {
      temperature: 0.75,
      maxTokens: 2048,
      thinkingBudget: 0,
      thinkingEnabled: false,
    };

    expect(params.temperature).toBe(0.75);
    expect(params.maxTokens).toBe(2048);
    expect(params.thinkingBudget).toBe(0);
    expect(params.thinkingEnabled).toBe(false);
  });
});
