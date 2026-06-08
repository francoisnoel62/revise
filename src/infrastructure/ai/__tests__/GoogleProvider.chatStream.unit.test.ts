// ABOUTME: Unit tests for GoogleProvider.chatStream
// ABOUTME: Verifies streaming multi-turn character chat via Google GenAI chats API

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';
import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  ThinkingLevel: { NONE: 'NONE' },
}));

async function* makeChunks(texts: string[]) {
  for (const text of texts) {
    yield { text };
  }
}

describe('GoogleProvider.chatStream', () => {
  let mockSendMessageStream: ReturnType<typeof vi.fn>;
  let mockCreateChat: ReturnType<typeof vi.fn>;
  let mockClient: { chats: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSendMessageStream = vi.fn().mockResolvedValue(makeChunks([]));
    mockCreateChat = vi.fn().mockReturnValue({ sendMessageStream: mockSendMessageStream });
    mockClient = { chats: { create: mockCreateChat } };

    vi.mocked(GoogleGenAI).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof GoogleGenAI>;
    } as unknown as typeof GoogleGenAI);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue(''),
    } as unknown as PromptRepository;

    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-flash');
  });

  it('yields text chunks from the stream', async () => {
    mockSendMessageStream.mockResolvedValue(makeChunks(['Bonjour', ' monde']));

    const messages = [ChatMessage.create('author', 'Salut')];
    const chunks: string[] = [];

    for await (const chunk of provider.chatStream(messages, 'Tu es un personnage.')) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Bonjour', ' monde']);
  });

  it('sends history (all but last) and last message separately', async () => {
    mockSendMessageStream.mockResolvedValue(makeChunks(['OK']));

    const messages = [
      ChatMessage.create('author', 'First'),
      ChatMessage.create('character', 'Reply'),
      ChatMessage.create('author', 'Last'),
    ];

    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    const chatArgs = mockCreateChat.mock.calls[0][0];
    expect(chatArgs.history).toHaveLength(2);
    expect(chatArgs.history[0].role).toBe('user');
    expect(chatArgs.history[1].role).toBe('model');

    const sendArgs = mockSendMessageStream.mock.calls[0][0];
    expect(sendArgs.message).toBe('Last');
  });

  it('passes systemInstruction from systemPrompt', async () => {
    mockSendMessageStream.mockResolvedValue(makeChunks([]));
    const messages = [ChatMessage.create('author', 'Hi')];

    for await (const _ of provider.chatStream(messages, 'My persona')) { /* drain */ }

    const chatArgs = mockCreateChat.mock.calls[0][0];
    expect(chatArgs.config.systemInstruction).toBe('My persona');
  });

  it('captures token usage from the stream usageMetadata', async () => {
    async function* withUsage() {
      yield { text: 'Bonjour' };
      yield { text: '', usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 9 } };
    }
    mockSendMessageStream.mockResolvedValue(withUsage());

    const messages = [ChatMessage.create('author', 'Salut')];
    for await (const _ of provider.chatStream(messages, 'sys')) { /* drain */ }

    expect(provider.getLastTokenUsage()).toEqual({
      inputTokens: 40,
      outputTokens: 9,
      cachedInputTokens: null,
    });
  });

  it('returns early when messages array is empty', async () => {
    const chunks: string[] = [];
    for await (const chunk of provider.chatStream([], 'sys')) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(0);
    expect(mockCreateChat).not.toHaveBeenCalled();
  });
});
