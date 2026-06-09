// ABOUTME: Unit tests for OpenAIProvider.chatStream
// ABOUTME: Verifies streaming multi-turn character chat via OpenAI SDK

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';
import OpenAI from 'openai';

vi.mock('openai', () => {
  return { default: vi.fn() };
});

async function* makeChunks(texts: string[]) {
  for (const text of texts) {
    yield { choices: [{ delta: { content: text } }] };
  }
}

describe('OpenAIProvider.chatStream', () => {
  let mockClient: { chat: { completions: { create: ReturnType<typeof vi.fn> } } };
  let mockPromptRepo: PromptRepository;
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };

    vi.mocked(OpenAI).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof OpenAI>;
    } as unknown as typeof OpenAI);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue(''),
    } as unknown as PromptRepository;

    provider = new OpenAIProvider('test-key', mockPromptRepo, 'gpt-4o-mini');
  });

  it('yields text chunks from the stream', async () => {
    mockClient.chat.completions.create.mockResolvedValue(
      makeChunks(['Hi', ' there', '!'])
    );

    const messages = [ChatMessage.create('author', 'Hello')];
    const chunks: string[] = [];

    for await (const chunk of provider.chatStream(messages, 'You are a character.')) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Hi', ' there', '!']);
  });

  it('maps author to user and character to assistant', async () => {
    mockClient.chat.completions.create.mockResolvedValue(makeChunks([]));

    const messages = [
      ChatMessage.create('author', 'Bonjour'),
      ChatMessage.create('character', 'Salut'),
    ];

    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    const [callArgs] = mockClient.chat.completions.create.mock.calls[0];
    // First message is the system prompt
    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[1].role).toBe('user');
    expect(callArgs.messages[2].role).toBe('assistant');
  });

  it('sends stream: true and max_tokens: 1024', async () => {
    mockClient.chat.completions.create.mockResolvedValue(makeChunks([]));
    const messages = [ChatMessage.create('author', 'Hello')];

    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    const [callArgs] = mockClient.chat.completions.create.mock.calls[0];
    expect(callArgs.stream).toBe(true);
    expect(callArgs.max_tokens).toBe(1024);
  });

  it('captures token usage from the final stream chunk', async () => {
    async function* withUsage() {
      yield { choices: [{ delta: { content: 'Hi' } }] };
      yield { choices: [], usage: { prompt_tokens: 50, completion_tokens: 12 } };
    }
    mockClient.chat.completions.create.mockResolvedValue(withUsage());

    const messages = [ChatMessage.create('author', 'Hi')];
    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    expect(provider.getLastTokenUsage()).toEqual({
      inputTokens: 50,
      outputTokens: 12,
      cachedInputTokens: null,
    });
  });

  it('requests usage in the stream via stream_options', async () => {
    mockClient.chat.completions.create.mockResolvedValue(makeChunks([]));
    const messages = [ChatMessage.create('author', 'Hi')];
    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    const [callArgs] = mockClient.chat.completions.create.mock.calls[0];
    expect(callArgs.stream_options).toEqual({ include_usage: true });
  });

  it('skips chunks with empty delta content', async () => {
    async function* mixedChunks() {
      yield { choices: [{ delta: { content: 'A' } }] };
      yield { choices: [{ delta: {} }] };
      yield { choices: [{ delta: { content: 'B' } }] };
    }
    mockClient.chat.completions.create.mockResolvedValue(mixedChunks());

    const chunks: string[] = [];
    const messages = [ChatMessage.create('author', 'Hi')];
    for await (const chunk of provider.chatStream(messages, 'sys')) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['A', 'B']);
  });
});
