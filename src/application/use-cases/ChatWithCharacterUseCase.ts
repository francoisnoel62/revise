// ABOUTME: Use-case for streaming a character chat turn and persisting the conversation.
// ABOUTME: Returns an async generator — callers iterate it to receive SSE chunks.

import { CharacterRepository } from '../../domain/interfaces/CharacterRepository';
import { CharacterConversationRepository } from '../../domain/interfaces/CharacterConversationRepository';
import { LLMProvider } from '../../domain/interfaces/LLMProvider';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { AIContextBuilder } from '../services/AIContextBuilder';
import { CharacterConversation } from '../../domain/entities/CharacterConversation';
import { ChatMessage } from '../../domain/value-objects/ChatMessage';

const MAX_HISTORY_MESSAGES = 20;

export interface ChatWithCharacterInput {
  userId: string;
  projectId: string;
  characterId: string;
  conversationId: string | null;
  message: string;
}

export class ChatWithCharacterUseCase {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly conversationRepository: CharacterConversationRepository,
    private readonly llmProvider: LLMProvider,
    private readonly contextBuilder: Pick<AIContextBuilder, 'buildCharacterPersona'>,
    private readonly idGenerator: IdGenerator,
  ) {}

  async *execute(input: ChatWithCharacterInput): AsyncIterableIterator<string> {
    const { userId, projectId, characterId, conversationId, message } = input;

    const character = await this.characterRepository.findById(userId, characterId);
    if (!character) throw new Error('Character not found');

    let conversation: CharacterConversation;
    if (conversationId) {
      const existing = await this.conversationRepository.findById(userId, conversationId);
      if (!existing) throw new Error('Conversation not found');
      conversation = existing;
    } else {
      const fresh = CharacterConversation.create(
        this.idGenerator.generate(),
        userId,
        projectId,
        characterId,
      );
      conversation = await this.conversationRepository.create(userId, fresh);
    }

    const authorMessage = ChatMessage.create('author', message);
    conversation = conversation.addMessage(authorMessage);

    const systemPrompt = await this.contextBuilder.buildCharacterPersona(character, userId, projectId);

    const allMessages = conversation.getMessages();
    const truncatedMessages = allMessages.slice(-MAX_HISTORY_MESSAGES);

    let responseContent = '';
    for await (const chunk of this.llmProvider.chatStream(truncatedMessages, systemPrompt)) {
      responseContent += chunk;
      yield chunk;
    }

    if (responseContent.trim()) {
      const characterMessage = ChatMessage.create('character', responseContent);
      conversation = conversation.addMessage(characterMessage);
      await this.conversationRepository.update(userId, conversation);
    }
  }
}
