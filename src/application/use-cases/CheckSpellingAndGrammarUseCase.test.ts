// ABOUTME: Unit tests for CheckSpellingAndGrammarUseCase
// ABOUTME: Tests spell check execution with mocked LLM provider

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckSpellingAndGrammarUseCase } from './CheckSpellingAndGrammarUseCase';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { SpellCheckCorrection } from '@/domain/value-objects/SpellCheckCorrection';

describe('CheckSpellingAndGrammarUseCase', () => {
  let mockProvider: LLMProvider;
  let useCase: CheckSpellingAndGrammarUseCase;

  beforeEach(() => {
    mockProvider = {
      generateRewrites: vi.fn(),
      testConnection: vi.fn(),
      generateNarrativeAnalysis: vi.fn(),
      generateCharacters: vi.fn(),
      generatePlot: vi.fn(),
      generateStylisticDNA: vi.fn(),
      generateWorldbuilding: vi.fn(),
      generateSynthesis: vi.fn(),
      generateChapterSummaries: vi.fn(),
      generateChapter: vi.fn(),
      generateCompletion: vi.fn(),
      generateCompletionStream: vi.fn(),
      checkSpellingAndGrammar: vi.fn(),
    } as unknown as LLMProvider;

    useCase = new CheckSpellingAndGrammarUseCase(mockProvider);
  });

  describe('execute', () => {
    it('should return empty result for empty text', async () => {
      const result = await useCase.execute('');

      expect(result.corrections).toEqual([]);
      expect(result.hasErrors).toBe(false);
      expect(result.correctedText).toBe('');
      expect(mockProvider.checkSpellingAndGrammar).not.toHaveBeenCalled();
    });

    it('should return empty result for whitespace-only text', async () => {
      const result = await useCase.execute('   ');

      expect(result.corrections).toEqual([]);
      expect(result.hasErrors).toBe(false);
      expect(mockProvider.checkSpellingAndGrammar).not.toHaveBeenCalled();
    });

    it('should call provider with text and language', async () => {
      const mockResult = {
        corrections: [
          new SpellCheckCorrection({
            original: 'apartement',
            corrected: 'appartement',
            type: 'spelling' as const,
            explanation: 'test',
          }),
        ],
        correctedText: 'Mon appartement est grand.',
        hasErrors: true,
        summary: '1 erreur trouvée',
      };

      vi.mocked(mockProvider.checkSpellingAndGrammar).mockResolvedValue(mockResult);

      const result = await useCase.execute('Mon apartement est grand.', 'fr');

      expect(mockProvider.checkSpellingAndGrammar).toHaveBeenCalledWith(
        'Mon apartement est grand.',
        'fr'
      );
      expect(result).toEqual(mockResult);
    });

    it('should call provider without language if not provided', async () => {
      const mockResult = {
        corrections: [],
        correctedText: 'Perfect text.',
        hasErrors: false,
        summary: 'Aucune erreur',
      };

      vi.mocked(mockProvider.checkSpellingAndGrammar).mockResolvedValue(mockResult);

      await useCase.execute('Perfect text.');

      expect(mockProvider.checkSpellingAndGrammar).toHaveBeenCalledWith(
        'Perfect text.',
        undefined
      );
    });

    it('should propagate provider errors', async () => {
      vi.mocked(mockProvider.checkSpellingAndGrammar).mockRejectedValue(
        new Error('API Error')
      );

      await expect(useCase.execute('Test text')).rejects.toThrow('API Error');
    });
  });
});
