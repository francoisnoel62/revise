// ABOUTME: Test suite for RepetitionAnalysisStrategy
// ABOUTME: Validates repetition detection with exclusions support (no streaming)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepetitionAnalysisStrategy } from './RepetitionAnalysisStrategy';
import { AnalysisOptions } from './AnalysisStrategy';
import { RepetitionCluster } from '../../domain/value-objects/RepetitionCluster';

interface MockLLMResponse {
  repetitions: Array<{
    word: string;
    count: number;
    positions: Array<{ start: number; end: number }>;
    suggestions: string[];
    isIntentional: boolean;
  }>;
}

const createMockLLMClient = (response: MockLLMResponse) => ({
  analyzeRepetitions: vi.fn().mockResolvedValue(response),
});

describe('RepetitionAnalysisStrategy', () => {
  let strategy: RepetitionAnalysisStrategy;
  let mockLLMClient: ReturnType<typeof createMockLLMClient>;

  const defaultOptions: AnalysisOptions = {
    language: 'fr',
    exclusions: [],
    ignoredTexts: [],
  };

  beforeEach(() => {
    mockLLMClient = createMockLLMClient({ repetitions: [] });
    strategy = new RepetitionAnalysisStrategy(mockLLMClient);
  });

  describe('category', () => {
    it('should have repetition as category', () => {
      expect(strategy.category).toBe('repetition');
    });
  });

  describe('supportsStreaming', () => {
    it('should NOT support streaming', () => {
      expect(strategy.supportsStreaming()).toBe(false);
    });
  });

  describe('analyze', () => {
    it('should return empty generator for empty content', async () => {
      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('', defaultOptions)) {
        issues.push(issue);
      }
      expect(issues).toHaveLength(0);
    });

    it('should detect word repetitions', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'soudain',
            count: 3,
            positions: [
              { start: 0, end: 7 },
              { start: 50, end: 57 },
              { start: 100, end: 107 },
            ],
            suggestions: ['brusquement', 'tout à coup'],
            isIntentional: false,
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Soudain il se leva. Puis soudain...', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        category: 'repetition',
        severity: 'warning',
        originalText: 'soudain',
      });
    });

    it('should exclude character names from exclusions', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'Jean',
            count: 5,
            positions: [
              { start: 0, end: 4 },
              { start: 20, end: 24 },
            ],
            suggestions: [],
            isIntentional: true,
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        exclusions: ['Jean'], // Character name
        ignoredTexts: [],
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Jean dit à Jean...', options)) {
        issues.push(issue);
      }

      // Should be excluded because it's in the exclusions list
      expect(issues).toHaveLength(0);
    });

    it('should pass exclusions to LLM client', async () => {
      const options: AnalysisOptions = {
        language: 'fr',
        exclusions: ['Marie', 'Paris'],
        ignoredTexts: [],
      };

      // Consume the generator
      for await (const _ of strategy.analyze('Test content', options)) {
        // Just consume
      }

      expect(mockLLMClient.analyzeRepetitions).toHaveBeenCalledWith(
        'Test content',
        expect.objectContaining({
          language: 'fr',
          exclusions: ['Marie', 'Paris'],
        })
      );
    });

    it('should mark intentional repetitions', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'jamais',
            count: 3,
            positions: [
              { start: 0, end: 6 },
              { start: 8, end: 14 },
              { start: 16, end: 22 },
            ],
            suggestions: [],
            isIntentional: true, // Rhetorical device
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Jamais, jamais, jamais!', defaultOptions)) {
        issues.push(issue);
      }

      // Intentional repetitions should still be flagged but noted
      expect(issues).toHaveLength(1);
    });

    it('should provide synonyms as suggestions in explanation', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'rapidement',
            count: 2,
            positions: [
              { start: 0, end: 10 },
              { start: 50, end: 60 },
            ],
            suggestions: ['vite', 'promptement', 'prestement'],
            isIntentional: false,
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const issues: Array<{ explanation: string }> = [];
      for await (const issue of strategy.analyze('Rapidement... puis rapidement.', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0].explanation).toContain('vite');
    });

    it('should handle multiple repetitions', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'alors',
            count: 3,
            positions: [
              { start: 0, end: 5 },
              { start: 20, end: 25 },
            ],
            suggestions: ['puis', 'ensuite'],
            isIntentional: false,
          },
          {
            word: 'très',
            count: 4,
            positions: [
              { start: 10, end: 14 },
              { start: 30, end: 34 },
            ],
            suggestions: ['fort', 'extrêmement'],
            isIntentional: false,
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Alors très... alors très...', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(2);
    });
  });

  describe('getRepetitionClusters', () => {
    it('should return repetition clusters', async () => {
      const mockResponse: MockLLMResponse = {
        repetitions: [
          {
            word: 'soudain',
            count: 3,
            positions: [
              { start: 0, end: 7 },
              { start: 50, end: 57 },
            ],
            suggestions: ['brusquement'],
            isIntentional: false,
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new RepetitionAnalysisStrategy(mockLLMClient);

      const clusters = await strategy.getRepetitionClusters('Test', defaultOptions);

      expect(clusters).toHaveLength(1);
      expect(clusters[0]).toBeInstanceOf(RepetitionCluster);
      expect(clusters[0].word).toBe('soudain');
    });
  });
});
