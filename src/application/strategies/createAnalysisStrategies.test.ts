// ABOUTME: Test suite for the analysis strategy factory.
// ABOUTME: Guards the invariant that no category is offered to the author without a strategy.

import { describe, it, expect, vi } from 'vitest';
import {
  ANALYSIS_CATEGORIES,
  type AnalysisCategory,
} from '../../domain/value-objects/AnalysisCategory';
import { createAnalysisStrategies, type AnalysisLLMPort } from './createAnalysisStrategies';

function createClient(): AnalysisLLMPort {
  return {
    analyzeStyle: vi.fn().mockResolvedValue({ issues: [] }),
    analyzeRepetitions: vi.fn().mockResolvedValue({ repetitions: [] }),
  };
}

describe('createAnalysisStrategies', () => {
  it('wires a strategy for every category the author can choose', () => {
    const strategies = createAnalysisStrategies(createClient(), ANALYSIS_CATEGORIES);

    for (const category of ANALYSIS_CATEGORIES) {
      expect(strategies.get(category)?.category).toBe(category);
    }
    expect(strategies.size).toBe(ANALYSIS_CATEGORIES.length);
  });

  it('builds only the strategies the author asked for', () => {
    const strategies = createAnalysisStrategies(createClient(), ['style']);

    expect([...strategies.keys()]).toEqual(['style']);
  });

  it('rejects a category with no strategy behind it', () => {
    expect(() =>
      createAnalysisStrategies(createClient(), ['grammar' as AnalysisCategory])
    ).toThrow(/grammar/);
  });
});
