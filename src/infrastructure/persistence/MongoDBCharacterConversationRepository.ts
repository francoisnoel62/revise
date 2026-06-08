// ABOUTME: MongoDB implementation of CharacterConversationRepository.
// ABOUTME: All queries filter by ownerId for multi-tenant isolation.

import { Db, ObjectId } from 'mongodb';
import { CharacterConversationRepository } from '../../domain/interfaces/CharacterConversationRepository';
import { CharacterConversation } from '../../domain/entities/CharacterConversation';
import {
  serializeConversation,
  deserializeConversation,
  CharacterConversationDocument,
} from './character-conversation-serializer';

const COLLECTION = 'character_conversations';

export class MongoDBCharacterConversationRepository
  implements CharacterConversationRepository
{
  constructor(private readonly db: Db) {}

  async ensureIndexes(): Promise<void> {
    const col = this.db.collection(COLLECTION);
    await col.createIndex({ ownerId: 1, characterId: 1 });
    await col.createIndex({ ownerId: 1, projectId: 1 });
  }

  async create(userId: string, conversation: CharacterConversation): Promise<CharacterConversation> {
    if (conversation.getOwnerId() !== userId) throw new Error('Ownership mismatch');
    const doc = serializeConversation(conversation);
    await this.db.collection<CharacterConversationDocument>(COLLECTION).insertOne(doc);
    return conversation;
  }

  async findById(userId: string, conversationId: string): Promise<CharacterConversation | null> {
    let objectId: ObjectId;
    try { objectId = new ObjectId(conversationId); } catch { return null; }
    const doc = await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .findOne({ _id: objectId, ownerId: userId });
    return doc ? deserializeConversation(doc) : null;
  }

  async findByCharacterId(userId: string, characterId: string): Promise<CharacterConversation[]> {
    const docs = await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .find({ ownerId: userId, characterId })
      .sort({ updatedAt: -1 })
      .toArray();
    return docs.map(deserializeConversation);
  }

  async update(userId: string, conversation: CharacterConversation): Promise<CharacterConversation> {
    if (conversation.getOwnerId() !== userId) throw new Error('Ownership mismatch');
    const doc = serializeConversation(conversation);
    const result = await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .replaceOne({ _id: doc._id, ownerId: userId }, doc);
    if (result.matchedCount === 0) throw new Error('Conversation not found or access denied');
    return conversation;
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    let objectId: ObjectId;
    try { objectId = new ObjectId(conversationId); } catch { return; }
    const result = await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .deleteOne({ _id: objectId, ownerId: userId });
    if (result.deletedCount === 0) throw new Error('Conversation not found or access denied');
  }

  async deleteByCharacterId(userId: string, characterId: string): Promise<void> {
    await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .deleteMany({ ownerId: userId, characterId });
  }

  async deleteByProjectId(userId: string, projectId: string): Promise<void> {
    await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .deleteMany({ ownerId: userId, projectId });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    await this.db
      .collection<CharacterConversationDocument>(COLLECTION)
      .deleteMany({ ownerId: userId });
  }
}
