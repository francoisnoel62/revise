// ABOUTME: Test suite for PunctuationAnalysisStrategy
// ABOUTME: Validates punctuation detection including commas, periods, quotes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PunctuationAnalysisStrategy } from './PunctuationAnalysisStrategy';
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
  analyzePunctuation: vi.fn().mockResolvedValue(response),
});

describe('PunctuationAnalysisStrategy', () => {
  let strategy: PunctuationAnalysisStrategy;
  let mockLLMClient: ReturnType<typeof createMockLLMClient>;

  const defaultOptions: AnalysisOptions = {
    language: 'fr',
    ignoredTexts: [],
  };

  beforeEach(() => {
    mockLLMClient = createMockLLMClient({ issues: [] });
    strategy = new PunctuationAnalysisStrategy(mockLLMClient);
  });

  describe('category', () => {
    it('should have punctuation as category', () => {
      expect(strategy.category).toBe('punctuation');
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

    it('should detect missing comma before "mais"', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'vrai mais',
            suggestion: 'vrai, mais',
            explanation: 'Virgule requise avant "mais"',
            position: { start: 5, end: 14 },
            context: "C'est vrai mais difficile.",
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new PunctuationAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze("C'est vrai mais difficile.", defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        category: 'punctuation',
        severity: 'error',
      });
    });

    it('should detect double spaces', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: '  ',
            suggestion: ' ',
            explanation: 'Double espace détecté',
            position: { start: 5, end: 7 },
            context: 'Hello  world',
            severity: 'warning',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new PunctuationAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Hello  world', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
    });

    it('should handle French guillemets', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: '"Bonjour"',
            suggestion: '« Bonjour »',
            explanation: 'Utiliser les guillemets français',
            position: { start: 0, end: 9 },
            context: '"Bonjour" dit-il.',
            severity: 'suggestion',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new PunctuationAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('"Bonjour" dit-il.', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        severity: 'suggestion',
      });
    });

    it('should filter out previously ignored texts', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: '  ',
            suggestion: ' ',
            explanation: 'Double espace',
            position: { start: 5, end: 7 },
            context: 'Hello  world',
            severity: 'warning',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new PunctuationAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        ignoredTexts: ['  '],
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Hello  world', options)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(0);
    });
  });
});
