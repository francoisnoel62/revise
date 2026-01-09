// ABOUTME: Unit test suite for AnthropicProvider using mocked Anthropic client
// ABOUTME: Validates prompt construction, response parsing, and error handling without real API calls

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider } from './AnthropicProvider';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';

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

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', 'claude-sonnet-4-5-20250929');
    // Access the mock after the provider is created
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.messages.create;
    mockCreate.mockClear();
  });

  it('should generate 5 rewrite proposals', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: [
              { content: 'First variant', styleLabel: 'épuré' },
              { content: 'Second variant', styleLabel: 'lyrique' },
              { content: 'Third variant', styleLabel: 'nerveux' },
              { content: 'Fourth variant', styleLabel: 'baroque' },
              { content: 'Fifth variant', styleLabel: 'amplifié' },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await provider.generateRewrites('The quick brown fox');

    expect(result).toHaveLength(5);
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
              { content: 'Variant 4' },
              { content: 'Variant 5' },
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
              { content: 'V4' },
              { content: 'V5' },
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
            proposals: Array(5).fill({ content: 'Test' }),
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
    }).rejects.toThrow('Expected exactly 5 proposals, got 2');
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
      proposals: Array(5).fill({ content: 'Test', styleLabel: 'épuré' }),
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

    expect(result).toHaveLength(5);
    expect(result[0].content).toBe('Test');
  });

  it('should handle JSON wrapped in plain markdown code blocks', async () => {
    const jsonContent = JSON.stringify({
      proposals: Array(5).fill({ content: 'Test', styleLabel: 'épuré' }),
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

    expect(result).toHaveLength(5);
    expect(result[0].content).toBe('Test');
  });

  it('should use system message for instructions', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            proposals: Array(5).fill({ content: 'Test' }),
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
    }).rejects.toThrow('Unexpected response type from Anthropic');
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
});
