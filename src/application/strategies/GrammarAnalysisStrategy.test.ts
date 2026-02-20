// ABOUTME: Test suite for GrammarAnalysisStrategy
// ABOUTME: Validates grammar detection, conjugation, and agreement checks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrammarAnalysisStrategy } from './GrammarAnalysisStrategy';
import { AnalysisOptions } from './AnalysisStrategy';

interface MockLLMResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: 'error' | 'warning' | 'suggestion';
  }>;
}

const createMockLLMClient = (response: MockLLMResponse) => ({
  analyzeGrammar: vi.fn().mockResolvedValue(response),
});

describe('GrammarAnalysisStrategy', () => {
  let strategy: GrammarAnalysisStrategy;
  let mockLLMClient: ReturnType<typeof createMockLLMClient>;

  const defaultOptions: AnalysisOptions = {
    language: 'fr',
    ignoredTexts: [],
  };

  beforeEach(() => {
    mockLLMClient = createMockLLMClient({ issues: [] });
    strategy = new GrammarAnalysisStrategy(mockLLMClient);
  });

  describe('category', () => {
    it('should have grammar as category', () => {
      expect(strategy.category).toBe('grammar');
    });
  });

  describe('supportsStreaming', () => {
    it('should support streaming', () => {
      expect(strategy.supportsStreaming()).toBe(true);
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

    it('should detect grammar errors and yield issues', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Les chien',
            suggestion: 'Les chiens',
            explanation: 'Accord pluriel manquant',
            position: { start: 0, end: 9 },
            context: 'Les chien court dans le jardin.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new GrammarAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Les chien court', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        category: 'grammar',
        severity: 'error',
        originalText: 'Les chien',
        suggestion: 'Les chiens',
      });
    });

    it('should detect conjugation errors', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Il mangera hier',
            suggestion: 'Il a mangé hier',
            explanation: 'Temps incorrect : le futur avec "hier"',
            position: { start: 0, end: 15 },
            context: 'Il mangera hier au restaurant.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new GrammarAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Il mangera hier', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
    });

    it('should detect participle agreement errors', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Elle est allé',
            suggestion: 'Elle est allée',
            explanation: 'Accord du participe passé avec le sujet féminin',
            position: { start: 0, end: 13 },
            context: 'Elle est allé au marché.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new GrammarAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Elle est allé', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
    });

    it('should filter out previously ignored texts', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Les chien',
            suggestion: 'Les chiens',
            explanation: 'Accord pluriel',
            position: { start: 0, end: 9 },
            context: 'Les chien court.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new GrammarAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        ignoredTexts: ['Les chien'],
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Les chien court', options)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(0);
    });
  });
});
