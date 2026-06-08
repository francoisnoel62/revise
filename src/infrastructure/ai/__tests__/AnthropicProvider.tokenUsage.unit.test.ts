// ABOUTME: Unit tests for AnthropicProvider token usage capture
// ABOUTME: Verifies getLastTokenUsage reflects the usage of the most recent API response

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: vi.fn(),
      };
    },
  };
});

const mockPromptRepository = {
  getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('mock prompt'),
} as unknown as PromptRepository;

function rewritesResponse(usage?: { input_tokens: number; output_tokens: number }) {
  return {
    usage,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          proposals: [
            { content: 'V1', styleLabel: 'épuré' },
            { content: 'V2', styleLabel: 'lyrique' },
            { content: 'V3', styleLabel: 'amplifié' },
          ],
        }),
      },
    ],
  };
}

describe('AnthropicProvider token usage', () => {
  let provider: AnthropicProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', mockPromptRepository, 'claude-sonnet-4-5-20250929');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.messages.create;
    mockCreate.mockClear();
  });

  it('returns null before any API call', () => {
    expect(provider.getLastTokenUsage()).toBeNull();
  });

  it('captures input and output tokens from the response usage', async () => {
    mockCreate.mockResolvedValue(rewritesResponse({ input_tokens: 1500, output_tokens: 420 }));

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: 1500, outputTokens: 420 });
  });

  it('reports null counts when the response carries no usage', async () => {
    mockCreate.mockResolvedValue(rewritesResponse(undefined));

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: null, outputTokens: null });
  });
});
