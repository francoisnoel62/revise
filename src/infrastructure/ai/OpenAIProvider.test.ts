// ABOUTME: Unit test suite for OpenAIProvider using mocked OpenAI client
// ABOUTME: Validates prompt construction, response parsing, and error handling without real API calls

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from './OpenAIProvider';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn(),
        },
      };
    },
  };
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key', 'gpt-4o');
    // Access the mock after the provider is created
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.chat.completions.create;
    mockCreate.mockClear();
  });

  it('should generate 3 rewrite proposals', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: [
                { content: 'First variant', styleLabel: 'épuré' },
                { content: 'Second variant', styleLabel: 'lyrique' },
                { content: 'Third variant', styleLabel: 'amplifié' },
              ],
            }),
          },
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
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: [
                { content: 'Variant 1' },
                { content: 'Variant 2' },
                { content: 'Variant 3' },
              ],
            }),
          },
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
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: [
                { content: 'V1' },
                { content: 'V2' },
                { content: 'V3' },
              ],
            }),
          },
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
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: Array(3).fill({ content: 'Test' }),
            }),
          },
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('text');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o',
      })
    );
  });

  it('should throw error if API returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Not valid JSON' } }],
    });

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('Failed to parse OpenAI response');
  });

  it('should throw error if response has wrong number of proposals', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: [
                { content: 'Only 1' },
                { content: 'Only 2' },
              ],
            }),
          },
        },
      ],
    });

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('Expected exactly 3 proposals, got 2');
  });

  it('should throw error if OpenAI API fails', async () => {
    mockCreate.mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    await expect(async () => {
      await provider.generateRewrites('text');
    }).rejects.toThrow('API rate limit exceeded');
  });

  it('should use JSON mode for structured output', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              proposals: Array(3).fill({ content: 'Test' }),
            }),
          },
        },
      ],
    };
    mockCreate.mockResolvedValue(mockResponse);

    await provider.generateRewrites('text');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: 'json_object' },
      })
    );
  });
});
