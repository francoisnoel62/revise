// ABOUTME: Server actions for character conversation management (create, list, load, delete).
// ABOUTME: All actions are session-protected and scoped by ownerId.

'use server';

import { getAuthenticatedUserId, getCharacterConversationRepo, getIdGenerator } from './utils';
import { CharacterConversation } from '@/domain/entities/CharacterConversation';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';

export interface SerializedConversation {
  id: string;
  characterId: string;
  projectId: string;
  messageCount: number;
  updatedAt: string;
}

export interface SerializedMessage {
  role: 'author' | 'character';
  content: string;
  createdAt: string;
}

function serializeConversation(conv: CharacterConversation): SerializedConversation {
  return {
    id: conv.getId(),
    characterId: conv.getCharacterId(),
    projectId: conv.getProjectId(),
    messageCount: conv.getMessages().length,
    updatedAt: conv.getUpdatedAt().toISOString(),
  };
}

function serializeMessage(msg: ChatMessage): SerializedMessage {
  return {
    role: msg.getRole(),
    content: msg.getContent(),
    createdAt: msg.getCreatedAt().toISOString(),
  };
}

export async function createConversationAction(
  projectId: string,
  characterId: string,
): Promise<{ success: true; data: SerializedConversation } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return { success: false, error: 'Non authentifié' };

    const repo = await getCharacterConversationRepo();
    const idGenerator = await getIdGenerator();
    const conversation = CharacterConversation.create(
      idGenerator.generate(),
      authResult.userId,
      projectId,
      characterId,
    );
    const saved = await repo.create(authResult.userId, conversation);
    return { success: true, data: serializeConversation(saved) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur' };
  }
}

export async function listConversationsAction(
  characterId: string,
): Promise<{ success: true; data: SerializedConversation[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return { success: false, error: 'Non authentifié' };

    const repo = await getCharacterConversationRepo();
    const conversations = await repo.findByCharacterId(authResult.userId, characterId);
    const sorted = [...conversations].sort(
      (a, b) => b.getUpdatedAt().getTime() - a.getUpdatedAt().getTime(),
    );
    return { success: true, data: sorted.map(serializeConversation) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur' };
  }
}

export async function loadConversationAction(
  conversationId: string,
): Promise<{ success: true; data: SerializedMessage[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return { success: false, error: 'Non authentifié' };

    const repo = await getCharacterConversationRepo();
    const conversation = await repo.findById(authResult.userId, conversationId);
    if (!conversation) return { success: false, error: 'Conversation non trouvée' };

    return { success: true, data: conversation.getMessages().map(serializeMessage) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur' };
  }
}

export async function deleteConversationAction(
  conversationId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return { success: false, error: 'Non authentifié' };

    const repo = await getCharacterConversationRepo();
    await repo.delete(authResult.userId, conversationId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur' };
  }
}
