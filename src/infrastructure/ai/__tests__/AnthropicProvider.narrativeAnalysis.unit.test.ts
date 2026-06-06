// ABOUTME: Unit tests for AnthropicProvider narrative analysis parsing logic
// ABOUTME: Tests JSON parsing, error handling, and validation without real API calls

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn()
  };
});

describe('AnthropicProvider.generateNarrativeAnalysis (Unit)', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

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

    // Mock Anthropic client
    mockClient = {
      messages: {
        create: vi.fn(),
      },
    };

    // Mock the Anthropic constructor to return our mock client
    vi.mocked(Anthropic).mockImplementation(function(this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    // Mock prompt repository
    mockPromptRepo = {
      getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('Test prompt'),
      getStylisticDNAPrompt: vi.fn().mockResolvedValue(''),
      getCharactersPrompt: vi.fn().mockResolvedValue(''),
      getPlotPrompt: vi.fn().mockResolvedValue(''),
      getWorldbuildingPrompt: vi.fn().mockResolvedValue(''),
      getSynthesisPrompt: vi.fn().mockResolvedValue(''),
      getChapterSummariesPrompt: vi.fn().mockResolvedValue(''),
      getChapterBeginningPrompt: vi.fn().mockResolvedValue(''),
      getChapterFullPrompt: vi.fn().mockResolvedValue(''),
      getChapterOutlinePrompt: vi.fn().mockResolvedValue(''),
      getCompletionPrompt: vi.fn().mockResolvedValue(''),
    } as import('@/domain/interfaces/PromptRepository').PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON response', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validNarrativeAnalysisResponse),
          },
        ],
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON wrapped in markdown code blocks (```json)', async () => {
      const jsonWithCodeBlock = `\`\`\`json
${JSON.stringify(validNarrativeAnalysisResponse, null, 2)}
\`\`\``;

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: jsonWithCodeBlock,
          },
        ],
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON wrapped in markdown code blocks (```)', async () => {
      const jsonWithCodeBlock = `\`\`\`
${JSON.stringify(validNarrativeAnalysisResponse, null, 2)}
\`\`\``;

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: jsonWithCodeBlock,
          },
        ],
      });

      const result = await provider.generateNarrativeAnalysis('Test text');

      expect(result).toEqual(validNarrativeAnalysisResponse);
    });

    it('should parse JSON with extra whitespace', async () => {
      const jsonWithWhitespace = `\n\n  ${JSON.stringify(validNarrativeAnalysisResponse)}  \n\n`;

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: jsonWithWhitespace,
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
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

      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidResponse),
          },
        ],
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Invalid response: missing summary'
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when response is not valid JSON', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'This is not JSON',
          },
        ],
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Failed to parse narrative analysis response from Anthropic'
      );
    });

    it('should throw error when response type is not text', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'image',
            data: 'image-data',
          },
        ],
      });

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'No text content in Anthropic response'
      );
    });

    it('should throw error when API call fails', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('API error'));

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow('API error');
    });

    it('should throw generic error for unknown errors', async () => {
      mockClient.messages.create.mockRejectedValue('String error');

      await expect(provider.generateNarrativeAnalysis('Test text')).rejects.toThrow(
        'Unknown error during narrative analysis'
      );
    });
  });

  describe('prompt repository integration', () => {
    it('should call prompt repository to get base prompt', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validNarrativeAnalysisResponse),
          },
        ],
      });

      await provider.generateNarrativeAnalysis('Test text');

      expect(mockPromptRepo.getNarrativeAnalysisPrompt).toHaveBeenCalledOnce();
    });

    it('should enhance base prompt with JSON instructions', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validNarrativeAnalysisResponse),
          },
        ],
      });

      await provider.generateNarrativeAnalysis('Test text');

      // Verify the create call received enhanced system prompt
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Test prompt'),
        })
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('FORMAT DE SORTIE JSON'),
        })
      );
    });
  });

  describe('API call parameters', () => {
    beforeEach(() => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validNarrativeAnalysisResponse),
          },
        ],
      });
    });

    it('should use correct model', async () => {
      await provider.generateNarrativeAnalysis('Test text');

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
        })
      );
    });

    it('should use max_tokens with thinking budget for thinking-capable models', async () => {
      await provider.generateNarrativeAnalysis('Test text');

      // Sonnet 4.5 supports thinking: max_tokens = baseMaxTokens (4096) + thinkingBudget (8192)
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 12288,
        })
      );
    });

    it('should omit temperature and enable thinking for thinking-capable models', async () => {
      await provider.generateNarrativeAnalysis('Test text');

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: { type: 'enabled', budget_tokens: 8192 },
        })
      );
      // Temperature must not be set when thinking is enabled
      const callArgs = mockClient.messages.create.mock.calls[0][0];
      expect(callArgs.temperature).toBeUndefined();
    });

    it('should send full text as user message', async () => {
      const testText = 'Full chapter text here';
      await provider.generateNarrativeAnalysis(testText);

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: testText }],
        })
      );
    });
  });
});
