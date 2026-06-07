// ABOUTME: Unit test suite for AnthropicProvider using mocked Anthropic client
// ABOUTME: Validates prompt construction, response parsing, and error handling without real API calls

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider } from './AnthropicProvider';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

// Mock Anthropic module
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: vi.fn(),
      };
    },
  };
});

// Mock PromptRepository for tests
const mockPromptRepository: PromptRepository = {
  getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('mock narrative prompt'),
  getStylisticDNAPrompt: vi.fn().mockResolvedValue('mock stylistic prompt'),
  getCharactersPrompt: vi.fn().mockResolvedValue('mock characters prompt'),
  getPlotPrompt: vi.fn().mockResolvedValue('mock plot prompt'),
  getWorldbuildingPrompt: vi.fn().mockResolvedValue('mock worldbuilding prompt'),
  getSynthesisPrompt: vi.fn().mockResolvedValue('mock synthesis prompt'),
  getChapterSummariesPrompt: vi.fn().mockResolvedValue('mock chapter summaries prompt'),
  getChapterBeginningPrompt: vi.fn().mockResolvedValue('mock chapter beginning prompt'),
  getChapterFullPrompt: vi.fn().mockResolvedValue('mock chapter full prompt'),
  getChapterOutlinePrompt: vi.fn().mockResolvedValue('mock chapter outline prompt'),
  getCompletionPrompt: vi.fn().mockResolvedValue('mock completion prompt'),
  getCharacterSheetPrompt: vi.fn().mockResolvedValue('mock character sheet prompt'),
};

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', mockPromptRepository, 'claude-sonnet-4-5-20250929');
    // Access the mock after the provider is created
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.messages.create;
    mockCreate.mockClear();
  });

  it('should generate 3 rewrite proposals', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: [
              { content: 'First variant', styleLabel: 'épuré' },
              { content: 'Second variant', styleLabel: 'lyrique' },
              { content: 'Third variant', styleLabel: 'amplifié' },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('The quick brown fox');

    expect(result).toHaveLength(3);
    expect(result[0]).toBeInstanceOf(RewriteProposal);
    expect(result[0].content).toBe('First variant');
    expect(result[0].styleLabel).toBe('épuré');
  });

  it('should pass selected text in prompt', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: [
              { content: 'Variant 1' },
              { content: 'Variant 2' },
              { content: 'Variant 3' },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('test text', 'full context');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('test text'),
          }),
        ]),
      })
    );
  });

  it('should include context in prompt when provided', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: [
              { content: 'V1' },
              { content: 'V2' },
              { content: 'V3' },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('selected', 'full document context');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('full document context'),
          }),
        ]),
      })
    );
  });

  it('should use specified model', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: Array(3).fill({ content: 'Test' }),
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('text');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-5-20250929',
      })
    );
  });

  it('should throw error if API returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Not valid JSON' }],
    });

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('Failed to parse Anthropic response');
  });

  it('should throw error if response has wrong number of proposals', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: [
              { content: 'Only 1' },
              { content: 'Only 2' },
            ],
          }),
        },
      ],
    });

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('Expected exactly 3 proposals, got 2');
  });

  it('should throw error if Anthropic API fails', async () => {
    mockCreate.mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('API rate limit exceeded');
  });

  it('should handle JSON wrapped in markdown code blocks', async () => {
    const jsonContent = JSON.stringify({
      proposals: Array(3).fill({ content: 'Test', styleLabel: 'épuré' }),
    });
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `\`\`\`json\n${jsonContent}\n\`\`\``,
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('text');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test');
  });

  it('should handle JSON wrapped in plain markdown code blocks', async () => {
    const jsonContent = JSON.stringify({
      proposals: Array(3).fill({ content: 'Test', styleLabel: 'épuré' }),
    });
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `\`\`\`\n${jsonContent}\n\`\`\``,
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('text');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test');
  });

  it('should handle JSON with trailing whitespace after code blocks', async () => {
    const jsonContent = JSON.stringify({
      proposals: Array(3).fill({ content: 'Test', styleLabel: 'épuré' }),
    });
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `\`\`\`json\n${jsonContent}\n\`\`\`\n\n`,
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('text');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test');
  });

  it('should handle JSON with explanatory text before code block', async () => {
    const jsonContent = JSON.stringify({
      proposals: Array(3).fill({ content: 'Test', styleLabel: 'épuré' }),
    });
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `Here is the analysis:\n\n\`\`\`json\n${jsonContent}\n\`\`\``,
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('text');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test');
  });

  it('should use system message for instructions', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: Array(3).fill({ content: 'Test' }),
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('text');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('assistant d\'écriture littéraire'),
      })
    );
  });

  it('should throw error if response type is not text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('No text content in Anthropic response');
  });

  describe('testConnection', () => {
    it('should return valid for successful connection', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }],
      });

      const result = await provider.testConnection();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid API key', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid API key provided'));

      const result = await provider.testConnection();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return error for authentication failure', async () => {
      mockCreate.mockRejectedValue(new Error('authentication failed'));

      const result = await provider.testConnection();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return error for rate limit', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await provider.testConnection();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rate limit exceeded, try again later');
    });

    it('should return error for quota exceeded', async () => {
      mockCreate.mockRejectedValue(new Error('Insufficient quota'));

      const result = await provider.testConnection();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API quota exceeded');
    });

    it('should return error for unavailable model', async () => {
      mockCreate.mockRejectedValue(new Error('Model not found for your account'));

      const result = await provider.testConnection();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Model not available for your account');
    });
  });

  describe('provider metadata', () => {
    it('should return provider name', () => {
      expect(provider.getProviderName()).toBe('Anthropic');
    });

    it('should return model name', () => {
      expect(provider.getModel()).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('extended thinking support', () => {
    describe('supportsThinking', () => {
      it('should return true for claude-opus-4-6', () => {
        const opusProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-opus-4-6');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((opusProvider as any).supportsThinking()).toBe(true);
      });

      it('should return true for claude-sonnet-4-5-20250929', () => {
        const sonnetProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-sonnet-4-5-20250929');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((sonnetProvider as any).supportsThinking()).toBe(true);
      });

      it('should return true for claude-haiku-4-5-20251001', () => {
        const haikuProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-haiku-4-5-20251001');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((haikuProvider as any).supportsThinking()).toBe(true);
      });

      it('should return true for claude-opus-4-5-20251101', () => {
        const opusOldProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-opus-4-5-20251101');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((opusOldProvider as any).supportsThinking()).toBe(true);
      });

      it('should return false for unknown models', () => {
        const unknownProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-3-5-sonnet-20240620');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((unknownProvider as any).supportsThinking()).toBe(false);
      });
    });

    describe('extractTextContent', () => {
      it('should extract text from response without thinking blocks', () => {
        const content = [{ type: 'text', text: 'Hello world' }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((provider as any).extractTextContent(content)).toBe('Hello world');
      });

      it('should skip thinking blocks and extract text', () => {
        const content = [
          { type: 'thinking', thinking: 'Let me analyze this...' },
          { type: 'text', text: 'The actual response' },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((provider as any).extractTextContent(content)).toBe('The actual response');
      });

      it('should skip redacted_thinking blocks and extract text', () => {
        const content = [
          { type: 'redacted_thinking', data: 'redacted' },
          { type: 'text', text: 'The actual response' },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((provider as any).extractTextContent(content)).toBe('The actual response');
      });

      it('should skip multiple thinking blocks', () => {
        const content = [
          { type: 'thinking', thinking: 'Step 1...' },
          { type: 'redacted_thinking', data: 'redacted' },
          { type: 'thinking', thinking: 'Step 2...' },
          { type: 'text', text: 'Final answer' },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((provider as any).extractTextContent(content)).toBe('Final answer');
      });

      it('should throw if no text block found', () => {
        const content = [{ type: 'thinking', thinking: 'Only thinking...' }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (provider as any).extractTextContent(content)).toThrow(
          'No text content in Anthropic response'
        );
      });

      it('should throw for empty content array', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (provider as any).extractTextContent([])).toThrow(
          'No text content in Anthropic response'
        );
      });
    });

    describe('buildApiParams', () => {
      it('should add thinking config for supported models', () => {
        const opusProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-opus-4-6');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = (opusProvider as any).buildApiParams({
          system: 'test system',
          messages: [{ role: 'user', content: 'test' }],
          baseMaxTokens: 4096,
          temperature: 0.3,
          thinkingBudget: 8192,
        });

        expect(params.thinking).toEqual({ type: 'enabled', budget_tokens: 8192 });
        expect(params.max_tokens).toBe(12288); // baseMaxTokens + thinkingBudget
        expect(params.temperature).toBeUndefined();
        expect(params.model).toBe('claude-opus-4-6');
      });

      it('should not add thinking for unsupported models', () => {
        const oldProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-3-5-sonnet-20240620');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = (oldProvider as any).buildApiParams({
          system: 'test system',
          messages: [{ role: 'user', content: 'test' }],
          baseMaxTokens: 4096,
          temperature: 0.3,
          thinkingBudget: 8192,
        });

        expect(params.thinking).toBeUndefined();
        expect(params.max_tokens).toBe(4096);
        expect(params.temperature).toBe(0.3);
      });

      it('should not add thinking when thinkingBudget is 0', () => {
        const opusProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-opus-4-6');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = (opusProvider as any).buildApiParams({
          system: 'test system',
          messages: [{ role: 'user', content: 'test' }],
          baseMaxTokens: 256,
          temperature: undefined,
          thinkingBudget: 0,
        });

        expect(params.thinking).toBeUndefined();
        expect(params.max_tokens).toBe(256);
      });

      it('should preserve system and messages in params', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = (provider as any).buildApiParams({
          system: 'my system prompt',
          messages: [{ role: 'user', content: 'my message' }],
          baseMaxTokens: 4096,
          temperature: 0.3,
          thinkingBudget: 8192,
        });

        expect(params.system).toBe('my system prompt');
        expect(params.messages).toEqual([{ role: 'user', content: 'my message' }]);
      });
    });

    describe('refusal handling', () => {
      it('should throw descriptive error when Claude refuses', async () => {
        mockCreate.mockResolvedValue({
          stop_reason: 'refusal',
          content: [{ type: 'text', text: 'I cannot process this content.' }],
        });

        await expect(provider.generateRewrites('some text')).rejects.toThrow(
          'Claude refused to process this content. Please check the submitted text.'
        );
      });

      it('should throw refusal error for analysis methods', async () => {
        mockCreate.mockResolvedValue({
          stop_reason: 'refusal',
          content: [{ type: 'text', text: 'Refused' }],
        });

        await expect(provider.generateNarrativeAnalysis('some text')).rejects.toThrow(
          'Claude refused to process this content. Please check the submitted text.'
        );
      });
    });

    describe('thinking with analysis methods', () => {
      let opusProvider: AnthropicProvider;
      let opusMockCreate: ReturnType<typeof vi.fn>;

      beforeEach(() => {
        opusProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-opus-4-6');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        opusMockCreate = (opusProvider as any).client.messages.create;
        opusMockCreate.mockClear();
      });

      it('should send thinking config with narrative analysis for opus-4-6', async () => {
        opusMockCreate.mockResolvedValue({
          stop_reason: 'end_turn',
          content: [
            { type: 'thinking', thinking: 'Analyzing narrative structure...' },
            {
              type: 'text',
              text: JSON.stringify({
                narratorType: 'First person narrator',
                focalization: 'Internal focalization',
                temporality: 'Linear temporality',
                chapterStructure: 'Classic three-act structure',
                narrativeVoice: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'],
                summary: 'A compelling narrative analysis',
              }),
            },
          ],
        });

        await opusProvider.generateNarrativeAnalysis('Some text');

        expect(opusMockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            thinking: { type: 'enabled', budget_tokens: expect.any(Number) },
          })
        );
        // Temperature should NOT be set when thinking is enabled
        const callArgs = opusMockCreate.mock.calls[0][0];
        expect(callArgs.temperature).toBeUndefined();
      });

      it('should extract text from response with thinking blocks', async () => {
        opusMockCreate.mockResolvedValue({
          stop_reason: 'end_turn',
          content: [
            { type: 'thinking', thinking: 'Deep analysis in progress...' },
            {
              type: 'text',
              text: JSON.stringify({
                narratorType: 'Third person omniscient',
                focalization: 'Zero focalization',
                temporality: 'Non-linear',
                chapterStructure: 'Episodic',
                narrativeVoice: ['V1', 'V2', 'V3', 'V4', 'V5'],
                summary: 'Summary text',
              }),
            },
          ],
        });

        const result = await opusProvider.generateNarrativeAnalysis('Some text');
        expect(result.narratorType).toBe('Third person omniscient');
      });

      it('should not send thinking config for sonnet model on completion', async () => {
        const sonnetProvider = new AnthropicProvider('fake-key', mockPromptRepository, 'claude-sonnet-4-5-20250929');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sonnetMock = (sonnetProvider as any).client.messages.create;

        (mockPromptRepository.getCompletionPrompt as ReturnType<typeof vi.fn>).mockResolvedValue('completion prompt');
        sonnetMock.mockResolvedValue({
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: 'completed text' }],
        });

        await sonnetProvider.generateCompletion('text before');

        const callArgs = sonnetMock.mock.calls[0][0];
        expect(callArgs.thinking).toBeUndefined();
      });
    });
  });
});
