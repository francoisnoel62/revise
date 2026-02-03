// ABOUTME: Test suite for SpellingAnalysisStrategy
// ABOUTME: Validates spelling detection, issue creation, and streaming behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpellingAnalysisStrategy } from './SpellingAnalysisStrategy';
import { AnalysisOptions } from './AnalysisStrategy';

// Mock LLM response type
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

// Create a mock LLM client that returns structured responses
const createMockLLMClient = (response: MockLLMResponse) => ({
  analyzeSpelling: vi.fn().mockResolvedValue(response),
});

describe('SpellingAnalysisStrategy', () => {
  let strategy: SpellingAnalysisStrategy;
  let mockLLMClient: ReturnType<typeof createMockLLMClient>;

  const defaultOptions: AnalysisOptions = {
    language: 'fr',
    ignoredTexts: [],
  };

  beforeEach(() => {
    mockLLMClient = createMockLLMClient({ issues: [] });
    strategy = new SpellingAnalysisStrategy(mockLLMClient);
  });

  describe('category', () => {
    it('should have spelling as category', () => {
      expect(strategy.category).toBe('spelling');
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

    it('should detect spelling errors and yield issues', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'à',
            suggestion: 'a',
            explanation: 'Confusion à/a : "a" sans accent est le verbe avoir',
            position: { start: 5, end: 6 },
            context: 'Elle à dit quelque chose.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      const content = 'Elle à dit quelque chose.';
      const issues: unknown[] = [];

      for await (const issue of strategy.analyze(content, defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        category: 'spelling',
        severity: 'error',
        originalText: 'à',
        suggestion: 'a',
      });
    });

    it('should filter out previously ignored texts', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'langage',
            suggestion: 'language',
            explanation: 'Spelling error',
            position: { start: 0, end: 7 },
            context: 'langage naturel',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      const options: AnalysisOptions = {
        language: 'fr',
        ignoredTexts: ['langage'], // This text was previously ignored
      };

      const issues: unknown[] = [];
      for await (const issue of strategy.analyze('langage naturel', options)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(0);
    });

    it('should detect multiple spelling errors', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'à',
            suggestion: 'a',
            explanation: 'Confusion à/a',
            position: { start: 5, end: 6 },
            context: 'Elle à dit.',
            severity: 'error',
          },
          {
            originalText: 'sa',
            suggestion: 'ça',
            explanation: 'Confusion sa/ça',
            position: { start: 20, end: 22 },
            context: 'sa va bien.',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      const content = 'Elle à dit. Oui, sa va bien.';
      const issues: unknown[] = [];

      for await (const issue of strategy.analyze(content, defaultOptions)) {
        issues.push(issue);
      }

      expect(issues).toHaveLength(2);
    });

    it('should assign unique IDs to each issue', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'test1',
            suggestion: 'test 1',
            explanation: 'Error 1',
            position: { start: 0, end: 5 },
            context: 'test1 context',
            severity: 'error',
          },
          {
            originalText: 'test2',
            suggestion: 'test 2',
            explanation: 'Error 2',
            position: { start: 10, end: 15 },
            context: 'test2 context',
            severity: 'error',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      const issues: Array<{ id: string }> = [];
      for await (const issue of strategy.analyze('test1 and test2', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues[0].id).not.toBe(issues[1].id);
    });

    it('should call LLM with correct parameters', async () => {
      const content = 'Test content';

      // Consume the generator
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of strategy.analyze(content, defaultOptions)) {
        // Just consume
      }

      expect(mockLLMClient.analyzeSpelling).toHaveBeenCalledWith(
        content,
        expect.objectContaining({
          language: 'fr',
        })
      );
    });

    it('should handle LLM errors gracefully', async () => {
      mockLLMClient.analyzeSpelling.mockRejectedValue(new Error('API Error'));
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      await expect(async () => {
        for await (const _ of strategy.analyze('content', defaultOptions)) {
          // consume
        }
      }).rejects.toThrow('API Error');
    });

    it('should set severity correctly based on LLM response', async () => {
      const mockResponse: MockLLMResponse = {
        issues: [
          {
            originalText: 'test',
            suggestion: 'Test',
            explanation: 'Capitalization',
            position: { start: 0, end: 4 },
            context: 'test context',
            severity: 'warning',
          },
        ],
      };

      mockLLMClient = createMockLLMClient(mockResponse);
      strategy = new SpellingAnalysisStrategy(mockLLMClient);

      const issues: Array<{ severity: string }> = [];
      for await (const issue of strategy.analyze('test', defaultOptions)) {
        issues.push(issue);
      }

      expect(issues[0].severity).toBe('warning');
    });
  });
});
