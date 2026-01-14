// ABOUTME: Unit tests for GoogleProvider narrative analysis parsing logic
// ABOUTME: Tests JSON parsing, error handling, and validation without real API calls

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';

// Create mock functions outside of vi.mock
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

// Mock new @google/genai SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      };
    },
  };
});

describe('GoogleProvider.generateNarrativeAnalysis (Unit)', () => {
  let mockPromptRepo: PromptRepository;
  let provider: GoogleProvider;

  const validNarrativeAnalysisResponse = {
    narratorType: 'Narrateur à la première personne, fiable et introspectif.',
    focalization: 'Focalisation interne, accès complet aux pensées du narrateur.',
    temporality: 'Temps du récit au passé composé, analepse occasionnelle.',
    chapterStructure: 'Chapitres courts, ouverture par description sensorielle.',
    narrativeVoice: [
      'Voix mélancolique et contemplative',
      'Style descriptif avec détails sensoriels',
      'Phrases courtes et directes',
      'Ton neutre et détaché',
      'Rythme lent et introspectif',
    ],
    summary: 'Récit à la première personne avec voix introspective et style épuré.',
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock prompt repository
    mockPromptRepo = {
      getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('Test prompt'),
    } as unknown as PromptRepository;

    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(validNarrativeAnalysisResponse),
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON wrapped in markdown code blocks (```json)', async () => {
      const jsonWithCodeBlock = `\`\`\`json
${JSON.stringify(validNarrativeAnalysisResponse, null, 2)}
\`\`\``;

      mockGenerateContent.mockResolvedValue({
        text: jsonWithCodeBlock,
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON wrapped in markdown code blocks (```)', async () => {
      const jsonWithCodeBlock = `\`\`\`
${JSON.stringify(validNarrativeAnalysisResponse, null, 2)}
\`\`\``;

      mockGenerateContent.mockResolvedValue({
        text: jsonWithCodeBlock,
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON with extra whitespace', async () => {
      const jsonWithWhitespace = `\n\n  ${JSON.stringify(validNarrativeAnalysisResponse)}  \n\n`;

      mockGenerateContent.mockResolvedValue({
        text: jsonWithWhitespace,
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });
  });

  describe('validation', () => {
    it('should throw error when narratorType is missing', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        narratorType: undefined,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing narratorType'
      );
    });

    it('should throw error when focalization is missing', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        focalization: undefined,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing focalization'
      );
    });

    it('should throw error when temporality is missing', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        temporality: undefined,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing temporality'
      );
    });

    it('should throw error when chapterStructure is missing', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        chapterStructure: undefined,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing chapterStructure'
      );
    });

    it('should throw error when narrativeVoice is not an array', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        narrativeVoice: 'Not an array',
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: narrativeVoice must be a non-empty array'
      );
    });

    it('should throw error when narrativeVoice array is empty', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        narrativeVoice: [],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: narrativeVoice must be a non-empty array'
      );
    });

    it('should throw error when summary is missing', async () => {
      const invalidResponse = {
        ...validNarrativeAnalysisResponse,
        summary: undefined,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(invalidResponse),
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing summary'
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when response is not valid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'This is not JSON',
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Failed to parse narrative analysis response from Google AI'
      );
    });

    it('should throw error when response is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Empty response from Google AI'
      );
    });

    it('should throw error when API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow('API error');
    });

    it('should throw generic error for unknown errors', async () => {
      mockGenerateContent.mockRejectedValue('String error');

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Unknown error during narrative analysis'
      );
    });
  });

  describe('prompt repository integration', () => {
    it('should call prompt repository to get base prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(validNarrativeAnalysisResponse),
      });

      await provider.generateNarrativeAnalysis('Test text');

      expect(mockPromptRepo.getNarrativeAnalysisPrompt).toHaveBeenCalledOnce();
    });
  });

  describe('provider info', () => {
    it('should return correct provider name', () => {
      expect(provider.getProviderName()).toBe('Google AI');
    });

    it('should return correct model', () => {
      expect(provider.getModel()).toBe('gemini-3-flash-preview');
    });
  });
});
