// ABOUTME: Unit tests for OpenAIProvider token usage capture
// ABOUTME: Verifies getLastTokenUsage reflects the usage of the most recent API response

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

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

const mockPromptRepository = {
  getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('mock prompt'),
} as unknown as PromptRepository;

function rewritesCompletion(usage?: { prompt_tokens: number; completion_tokens: number }) {
  return {
    usage,
    choices: [
      {
        message: {
          content: JSON.stringify({
            proposals: [
              { content: 'V1', styleLabel: 'épuré' },
              { content: 'V2', styleLabel: 'lyrique' },
              { content: 'V3', styleLabel: 'amplifié' },
            ],
          }),
        },
      },
    ],
  };
}

describe('OpenAIProvider token usage', () => {
  let provider: OpenAIProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key', mockPromptRepository, 'gpt-4o');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.chat.completions.create;
    mockCreate.mockClear();
  });

  it('returns null before any API call', () => {
    expect(provider.getLastTokenUsage()).toBeNull();
  });

  it('captures prompt and completion tokens from the response usage', async () => {
    mockCreate.mockResolvedValue(rewritesCompletion({ prompt_tokens: 800, completion_tokens: 210 }));

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: 800, outputTokens: 210 });
  });

  it('reports null counts when the response carries no usage', async () => {
    mockCreate.mockResolvedValue(rewritesCompletion(undefined));

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: null, outputTokens: null });
  });
});
