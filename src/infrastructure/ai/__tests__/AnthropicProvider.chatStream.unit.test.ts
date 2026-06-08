// ABOUTME: Unit tests for AnthropicProvider.chatStream
// ABOUTME: Verifies streaming multi-turn character chat via Anthropic SDK

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

async function* makeStreamEvents(texts: string[]) {
  for (const text of texts) {
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text },
    };
  }
  yield { type: 'message_stop' };
}

describe('AnthropicProvider.chatStream', () => {
  let mockClient: { messages: { stream: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        stream: vi.fn(),
      },
    };

    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue(''),
    } as unknown as PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-test');
  });

  it('yields text chunks from the stream', async () => {
    mockClient.messages.stream.mockReturnValue(
      makeStreamEvents(['Hello', ', ', 'world!'])
    );

    const messages = [ChatMessage.create('author', 'Who are you?')];
    const chunks: string[] = [];

    for await (const chunk of provider.chatStream(messages, 'You are a character.')) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Hello', ', ', 'world!']);
  });

  it('maps author role to user and character role to assistant', async () => {
    mockClient.messages.stream.mockReturnValue(makeStreamEvents(['OK']));

    const messages = [
      ChatMessage.create('author', 'Hi'),
      ChatMessage.create('character', 'Hello'),
      ChatMessage.create('author', 'Bye'),
    ];

    for await (const _ of provider.chatStream(messages, 'system')) { /* drain */ }

    const [callArgs] = mockClient.messages.stream.mock.calls[0];
    expect(callArgs.messages[0].role).toBe('user');
    expect(callArgs.messages[1].role).toBe('assistant');
    expect(callArgs.messages[2].role).toBe('user');
  });

  it('captures token usage from message_start and message_delta events', async () => {
    async function* withUsage() {
      yield { type: 'message_start', message: { usage: { input_tokens: 100 } } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi' } };
      yield { type: 'message_delta', usage: { output_tokens: 20 } };
      yield { type: 'message_stop' };
    }
    mockClient.messages.stream.mockReturnValue(withUsage());

    const messages = [ChatMessage.create('author', 'Hi')];
    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: 100, outputTokens: 20 });
  });

  it('passes system prompt and caps max_tokens at 1024', async () => {
    mockClient.messages.stream.mockReturnValue(makeStreamEvents([]));

    const messages = [ChatMessage.create('author', 'Hello')];
    for await (const _ of provider.chatStream(messages, 'My persona')) { /* drain */ }

    const [callArgs] = mockClient.messages.stream.mock.calls[0];
    expect(callArgs.system).toBe('My persona');
    expect(callArgs.max_tokens).toBe(1024);
  });
});
