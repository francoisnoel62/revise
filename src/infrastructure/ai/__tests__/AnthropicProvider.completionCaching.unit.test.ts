// ABOUTME: Unit tests for prompt caching on AnthropicProvider.generateCompletionStream
// ABOUTME: The stable base prompt must be a cache_control block; volatile context stays uncached

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

async function* emptyStream() {
  // No events needed; the provider just iterates to completion.
}

describe('AnthropicProvider.generateCompletionStream — prompt caching', () => {
  let mockClient: { messages: { stream: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        stream: vi.fn().mockReturnValue(emptyStream()),
      },
    };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue('Base completion prompt'),
    } as unknown as PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  async function drain(it: AsyncIterableIterator<string>) {
    for await (const _ of it) {
      void _;
    }
  }

  it('marks the base prompt as an ephemeral cache block', async () => {
    await drain(provider.generateCompletionStream('text before'));

    const params = mockClient.messages.stream.mock.calls[0][0];
    expect(Array.isArray(params.system)).toBe(true);
    expect(params.system[0]).toEqual({
      type: 'text',
      text: 'Base completion prompt',
      cache_control: { type: 'ephemeral' },
    });
  });

  it('puts volatile project context in a separate uncached block', async () => {
    await drain(
      provider.generateCompletionStream('text before', undefined, '\n\n[CANON]\nLéa : est morte')
    );

    const params = mockClient.messages.stream.mock.calls[0][0];
    expect(params.system).toHaveLength(2);
    expect(params.system[1].cache_control).toBeUndefined();
    expect(params.system[1].text).toContain('[CANON]');
  });
});
