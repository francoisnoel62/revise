// ABOUTME: Test suite for StyleAnalysisStrategy
// ABOUTME: Validates style detection based on configurable rigor levels

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StyleAnalysisStrategy } from './StyleAnalysisStrategy';
import { AnalysisOptions } from './AnalysisStrategy';

interface MockLLMResponse {
  issues: Array<{
    originalText: string;
    suggestion: string;
    explanation: string;
    position: { start: number; end: number };
    context: string;
    severity: 'error' | 'warning' | 'suggestion';
    ruleId: string;
  }>;
}

const createMockLLMClient = (response: MockLLMResponse) => ({
  analyzeStyle: vi.fn().mockResolvedValue(response),
});

describe('StyleAnalysisStrategy', () => {
  let strategy: StyleAnalysisStrategy;
  let mockLLMClient: ReturnType<typeof createMockLLMClient>;

  const defaultOptions: AnalysisOptions = {
    language: 'fr',
    styleRigor: 'moderate',
    ignoredTexts: [],
  };

  beforeEach(() => {
    mockLLMClient = createMockLLMClient({ issues: [] });
    strategy = new StyleAnalysisStrategy(mockLLMClient);
  });

  describe('category', () => {
    it('should have style as category', () => {
      expect(strategy.category).toBe('style');
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

    it('should detect excessive passive voice', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Le livre a été lu par Marie',
            suggestion: 'Marie a lu le livre',
            explanation: 'Voix passive : préférer la voix active',
            position: { start: 0, end: 27 },
            context: 'Le livre a été lu par Marie hier.',
            severity: 'suggestion',
            ruleId: 'excessive-passive-voice',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new StyleAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Le livre a été lu par Marie hier.', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        category: 'style',
        severity: 'suggestion',
      });
    });

    it('should detect very long sentences', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Cette phrase est très longue...',
            suggestion: '',
            explanation: 'Phrase de plus de 50 mots : envisager de la diviser',
            position: { start: 0, end: 200 },
            context: 'Cette phrase est très longue...',
            severity: 'warning',
            ruleId: 'very-long-sentences',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new StyleAnalysisStrategy(mockLLMClient);

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Cette phrase est très longue...', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
    });

    it('should pass rigor level to LLM client', async () => {
      const options: AnalysisOptions = {
        language: 'fr',
        styleRigor: 'strict',
        ignoredTexts: [],
      };

      // Consume the generator
      for await (const _ of strategy.analyze('Test content', options)) {
        // Just consume
      }

      expect(mockLLMClient.analyzeStyle).toHaveBeenCalledWith(
        'Test content',
        expect.objectContaining({
          language: 'fr',
          rigor: 'strict',
        })
      );
    });

    it('should detect weak verbs at strict level', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Il y a',
            suggestion: 'Il existe',
            explanation: 'Verbe faible : préférer un verbe plus précis',
            position: { start: 0, end: 6 },
            context: 'Il y a beaucoup de monde.',
            severity: 'suggestion',
            ruleId: 'weak-verbs',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new StyleAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        styleRigor: 'strict',
        ignoredTexts: [],
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Il y a beaucoup de monde.', options)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
    });

    it('should allow empty suggestion for style issues', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Long sentence here...',
            suggestion: '', // Empty suggestion is valid for style
            explanation: 'Consider breaking this sentence',
            position: { start: 0, end: 20 },
            context: 'Long sentence here...',
            severity: 'suggestion',
            ruleId: 'very-long-sentences',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new StyleAnalysisStrategy(mockLLMClient);

      const issues: Array<{ suggestion: string }> = [];
      for await (const issue of strategy.analyze('Long sentence here...', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0].suggestion).toBe('');
    });

    it('should filter out ignored texts', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'Il y a',
            suggestion: 'Il existe',
            explanation: 'Verbe faible',
            position: { start: 0, end: 6 },
            context: 'Il y a beaucoup.',
            severity: 'suggestion',
            ruleId: 'weak-verbs',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new StyleAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        styleRigor: 'strict',
        ignoredTexts: ['Il y a'],
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('Il y a beaucoup.', options)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(0);
    });
  });
});
