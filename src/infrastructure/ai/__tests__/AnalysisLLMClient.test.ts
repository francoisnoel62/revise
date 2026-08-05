// ABOUTME: Unit tests for AnalysisLLMClient implementations
// ABOUTME: Tests OpenAI, Anthropic, and Google analysis clients with mocked SDKs

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OpenAIAnalysisLLMClient,
  AnthropicAnalysisLLMClient,
  GoogleAnalysisLLMClient,
  createAnalysisLLMClient,
} from '../AnalysisLLMClient';

// Create mock functions outside vi.mock
const mockOpenAICreate = vi.fn();
const mockAnthropicCreate = vi.fn();
const mockGoogleGenerateContent = vi.fn();

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: mockOpenAICreate,
        },
      };
    },
  };
});

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: mockAnthropicCreate,
      };
    },
  };
});

// Mock Google GenAI
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGoogleGenerateContent,
      };
    },
  };
});

const styleOptions = (language: 'fr' | 'en') =>
  ({ language, rigor: 'moderate', activeRules: [] }) as const;

describe('AnalysisLLMClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnalysisLLMClient factory', () => {
    it('should create OpenAI client for openai provider', () => {
      const client = createAnalysisLLMClient('openai', 'test-key');
      expect(client).toBeInstanceOf(OpenAIAnalysisLLMClient);
    });

    it('should create Anthropic client for anthropic provider', () => {
      const client = createAnalysisLLMClient('anthropic', 'test-key');
      expect(client).toBeInstanceOf(AnthropicAnalysisLLMClient);
    });

    it('should create Google client for google provider', () => {
      const client = createAnalysisLLMClient('google', 'test-key');
      expect(client).toBeInstanceOf(GoogleAnalysisLLMClient);
    });

    it('should throw error for unsupported provider', () => {
      expect(() =>
        createAnalysisLLMClient('unsupported' as 'openai', 'test-key')
      ).toThrow('Unsupported provider: unsupported');
    });

    it('should pass custom model to OpenAI client', () => {
      const client = createAnalysisLLMClient('openai', 'test-key', 'gpt-4-turbo');
      expect(client).toBeInstanceOf(OpenAIAnalysisLLMClient);
    });

    it('should pass custom model to Anthropic client', () => {
      const client = createAnalysisLLMClient('anthropic', 'test-key', 'claude-3-opus');
      expect(client).toBeInstanceOf(AnthropicAnalysisLLMClient);
    });

    it('should pass custom model to Google client', () => {
      const client = createAnalysisLLMClient('google', 'test-key', 'gemini-pro');
      expect(client).toBeInstanceOf(GoogleAnalysisLLMClient);
    });
  });

  describe('OpenAIAnalysisLLMClient', () => {
    let client: OpenAIAnalysisLLMClient;

    beforeEach(() => {
      client = new OpenAIAnalysisLLMClient('test-key', 'gpt-4o');
    });

    it('should throw error when no response content', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(client.analyzeStyle('test', styleOptions('en'))).rejects.toThrow(
        'No response from LLM'
      );
    });

    it('should throw error when response is not valid JSON', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: 'not json' } }],
      });

      await expect(client.analyzeStyle('test', styleOptions('en'))).rejects.toThrow(
        'Failed to parse LLM response'
      );
    });

    it('should pass French language in prompt', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{ message: { content: '{"issues": []}' } }],
      });

      await client.analyzeStyle('Bonjour', styleOptions('fr'));

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('French'),
            }),
          ]),
        })
      );
    });
  });

  describe('AnthropicAnalysisLLMClient', () => {
    let client: AnthropicAnalysisLLMClient;

    beforeEach(() => {
      client = new AnthropicAnalysisLLMClient('test-key', 'claude-sonnet-4-5-20250929');
    });

    it('should call Anthropic API for style analysis', async () => {
      const mockResponse = {
        issues: [
          {
            originalText: 'She go',
            suggestion: 'She goes',
            explanation: 'Subject-verb agreement',
            position: { start: 0, end: 6 },
            context: 'She go to school',
            severity: 'error',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
      });

      const result = await client.analyzeStyle('She go to school', styleOptions('en'));

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].suggestion).toBe('She goes');
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          temperature: 0.3,
          max_tokens: 8192,
        })
      );
    });

    it('should extract JSON from markdown code block', async () => {
      const mockResponse = {
        issues: [],
      };

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: '```json\n' + JSON.stringify(mockResponse) + '\n```' }],
      });

      const result = await client.analyzeStyle('test', styleOptions('en'));
      expect(result.issues).toHaveLength(0);
    });

    it('should extract JSON from unclosed markdown code block', async () => {
      const mockResponse = {
        issues: [],
      };

      // Simulate truncated response without closing ```
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: '```json\n' + JSON.stringify(mockResponse) }],
      });

      const result = await client.analyzeStyle('test', styleOptions('en'));
      expect(result.issues).toHaveLength(0);
    });

    it('should extract JSON from text with extra content', async () => {
      const mockResponse = { issues: [] };

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Here is the analysis:\n' + JSON.stringify(mockResponse) }],
      });

      const result = await client.analyzeStyle('test', styleOptions('en'));
      expect(result.issues).toHaveLength(0);
    });

    it('should throw error for non-text response type', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'image', text: null }],
      });

      await expect(client.analyzeStyle('test', styleOptions('en'))).rejects.toThrow(
        'Unexpected response type from Anthropic'
      );
    });

    it('should handle style analysis with rigor and rules', async () => {
      const mockResponse = { issues: [] };

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
      });

      await client.analyzeStyle('test content', {
        language: 'fr',
        rigor: 'strict',
        activeRules: ['avoid_passive', 'vary_sentence_length'],
      });

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('strict'),
            }),
          ]),
        })
      );
    });

    it('should pass English language in prompt', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{"issues": []}' }],
      });

      await client.analyzeStyle('Hello', styleOptions('en'));

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('English'),
            }),
          ]),
        })
      );
    });
  });

  describe('GoogleAnalysisLLMClient', () => {
    let client: GoogleAnalysisLLMClient;

    beforeEach(() => {
      client = new GoogleAnalysisLLMClient('test-key', 'gemini-3-flash-preview');
    });

    it('should call Google API for style analysis', async () => {
      const mockResponse = {
        issues: [
          {
            originalText: 'Hello world',
            suggestion: 'Hello, world',
            explanation: 'Missing comma',
            position: { start: 0, end: 11 },
            context: 'Hello world how are you',
            severity: 'warning',
          },
        ],
      };

      mockGoogleGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await client.analyzeStyle('Hello world how are you', styleOptions('en'));

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].suggestion).toBe('Hello, world');
      expect(mockGoogleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          config: expect.objectContaining({
            temperature: 0.3,
            maxOutputTokens: 8192,
          }),
        })
      );
    });

    it('should extract JSON from markdown code block', async () => {
      const mockResponse = { issues: [] };

      mockGoogleGenerateContent.mockResolvedValue({
        text: '```json\n' + JSON.stringify(mockResponse) + '\n```',
      });

      const result = await client.analyzeStyle('test', styleOptions('en'));
      expect(result.issues).toHaveLength(0);
    });

    it('should throw error when response is empty', async () => {
      mockGoogleGenerateContent.mockResolvedValue({
        text: null,
      });

      await expect(client.analyzeStyle('test', styleOptions('en'))).rejects.toThrow(
        'Empty response from Google AI'
      );
    });

    it('should handle repetition analysis with exclusions', async () => {
      const mockResponse = {
        clusters: [
          {
            word: 'suddenly',
            count: 5,
            positions: [{ start: 0, end: 8 }],
            suggestions: ['abruptly', 'unexpectedly'],
          },
        ],
      };

      mockGoogleGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      await client.analyzeRepetitions('suddenly the door opened', {
        language: 'en',
        exclusions: ['John', 'Paris'],
      });

      expect(mockGoogleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('John, Paris'),
        })
      );
    });

    it('should handle empty exclusions list', async () => {
      const mockResponse = { clusters: [] };

      mockGoogleGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      await client.analyzeRepetitions('test content', {
        language: 'fr',
        exclusions: [],
      });

      expect(mockGoogleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('none'),
        })
      );
    });
  });
});
