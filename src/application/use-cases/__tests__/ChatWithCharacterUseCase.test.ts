// ABOUTME: Unit tests for ChatWithCharacterUseCase
// ABOUTME: Validates streaming, conversation lifecycle, history truncation, and persistence

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatWithCharacterUseCase, ChatWithCharacterInput } from '../ChatWithCharacterUseCase';
import { Character } from '../../../domain/entities/Character';
import { CharacterConversation } from '../../../domain/entities/CharacterConversation';
import { ChatMessage } from '../../../domain/value-objects/ChatMessage';

const makeCharacter = () => Character.create('char-1', 'proj-1', 'user-1', 'Élise');
const makeConversation = (id = 'conv-1') =>
  CharacterConversation.create(id, 'user-1', 'proj-1', 'char-1');

async function* fakeStream(chunks: string[]): AsyncIterableIterator<string> {
  for (const chunk of chunks) yield chunk;
}

const makeInput = (overrides: Partial<ChatWithCharacterInput> = {}): ChatWithCharacterInput => ({
  userId: 'user-1',
  projectId: 'proj-1',
  characterId: 'char-1',
  conversationId: null,
  message: 'Hello character!',
  ...overrides,
});

describe('ChatWithCharacterUseCase', () => {
  let characterRepo: any;
  let conversationRepo: any;
  let llmProvider: any;
  let contextBuilder: any;
  let idGenerator: any;
  let useCase: ChatWithCharacterUseCase;

  beforeEach(() => {
    characterRepo = {
      findById: vi.fn().mockResolvedValue(makeCharacter()),
      create: vi.fn(),
      findByProjectId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    conversationRepo = {
      create: vi.fn().mockResolvedValue(makeConversation()),
      findById: vi.fn(),
      findByCharacterId: vi.fn(),
      update: vi.fn().mockImplementation(async (_userId: string, conv: CharacterConversation) => conv),
      delete: vi.fn(),
      deleteByCharacterId: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };

    llmProvider = {
      chatStream: vi.fn().mockReturnValue(fakeStream(['Hello ', 'world!'])),
    };

    contextBuilder = {
      buildCharacterPersona: vi.fn().mockResolvedValue('You are Élise...'),
    };

    idGenerator = {
      generate: vi.fn().mockReturnValue('new-conv-id'),
    };

    useCase = new ChatWithCharacterUseCase(
      characterRepo,
      conversationRepo,
      llmProvider,
      contextBuilder,
      idGenerator,
    );
  });

  it('yields text chunks from the stream', async () => {
    const chunks: string[] = [];
    for await (const chunk of useCase.execute(makeInput())) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hello ', 'world!']);
  });

  it('persists the accumulated character response after streaming', async () => {
    for await (const _ of useCase.execute(makeInput())) { /* drain */ }

    expect(conversationRepo.update).toHaveBeenCalledOnce();
    const [, savedConv] = conversationRepo.update.mock.calls[0] as [string, CharacterConversation];
    const characterMsg = savedConv.getMessages().find((m: ChatMessage) => m.getRole() === 'character');
    expect(characterMsg).toBeDefined();
    expect(characterMsg!.getContent()).toBe('Hello world!');
  });

  it('creates a new conversation when conversationId is null', async () => {
    for await (const _ of useCase.execute(makeInput({ conversationId: null }))) { /* drain */ }

    expect(conversationRepo.create).toHaveBeenCalledOnce();
    expect(conversationRepo.findById).not.toHaveBeenCalled();
  });

  it('reuses an existing conversation when conversationId is provided', async () => {
    conversationRepo.findById.mockResolvedValue(makeConversation('existing-conv'));

    for await (const _ of useCase.execute(makeInput({ conversationId: 'existing-conv' }))) { /* drain */ }

    expect(conversationRepo.findById).toHaveBeenCalledWith('user-1', 'existing-conv');
    expect(conversationRepo.create).not.toHaveBeenCalled();
  });

  it('throws when the character does not exist', async () => {
    characterRepo.findById.mockResolvedValue(null);

    await expect(async () => {
      for await (const _ of useCase.execute(makeInput())) { /* drain */ }
    }).rejects.toThrow('Character not found');
  });

  it('throws when the conversation does not exist', async () => {
    conversationRepo.findById.mockResolvedValue(null);

    await expect(async () => {
      for await (const _ of useCase.execute(makeInput({ conversationId: 'missing-conv' }))) { /* drain */ }
    }).rejects.toThrow('Conversation not found');
  });

  it('truncates history to 20 messages before calling chatStream', async () => {
    let conv = makeConversation('conv-25');
    for (let i = 0; i < 25; i++) {
      conv = conv.addMessage(ChatMessage.create('author', `Message ${i}`));
    }
    conversationRepo.findById.mockResolvedValue(conv);

    for await (const _ of useCase.execute(makeInput({ conversationId: 'conv-25' }))) { /* drain */ }

    const [messages] = llmProvider.chatStream.mock.calls[0] as [ChatMessage[]];
    expect(messages.length).toBeLessThanOrEqual(20);
  });

  it('does not persist when the response stream is empty', async () => {
    async function* emptyStream(): AsyncIterableIterator<string> { /* empty */ }
    llmProvider.chatStream.mockReturnValue(emptyStream());

    for await (const _ of useCase.execute(makeInput())) { /* drain */ }

    expect(conversationRepo.update).not.toHaveBeenCalled();
  });

  it('does not mutate the original conversation object', async () => {
    const conv = makeConversation('conv-1');
    const originalCount = conv.getMessages().length;
    conversationRepo.findById.mockResolvedValue(conv);

    for await (const _ of useCase.execute(makeInput({ conversationId: 'conv-1' }))) { /* drain */ }

    expect(conv.getMessages().length).toBe(originalCount);
  });
});
