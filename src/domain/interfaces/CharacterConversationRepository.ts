// ABOUTME: Repository interface for persisting character conversations.
// ABOUTME: All methods filter by ownerId to enforce multi-tenant isolation.

import { CharacterConversation } from '../entities/CharacterConversation';

export interface CharacterConversationRepository {
  create(userId: string, conversation: CharacterConversation): Promise<CharacterConversation>;
  findById(userId: string, conversationId: string): Promise<CharacterConversation | null>;
  findByCharacterId(userId: string, characterId: string): Promise<CharacterConversation[]>;
  update(userId: string, conversation: CharacterConversation): Promise<CharacterConversation>;
  delete(userId: string, conversationId: string): Promise<void>;
  deleteByCharacterId(userId: string, characterId: string): Promise<void>;
  deleteByProjectId(userId: string, projectId: string): Promise<void>;
  deleteAllByOwner(userId: string): Promise<void>;
}
