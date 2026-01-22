// ABOUTME: MongoDB implementation of CharacterRepository
// ABOUTME: Provides persistence for character entities with multi-tenant isolation

import { Db, ObjectId } from 'mongodb';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { Character } from '@/domain/entities/Character';
import {
  CharacterDocument,
  serializeCharacter,
  deserializeCharacter,
} from './character-serializer';

const COLLECTION_NAME = 'characters';

export class MongoDBCharacterRepository implements CharacterRepository {
  constructor(private readonly db: Db) {}

  async ensureIndexes(): Promise<void> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    await collection.createIndex({ ownerId: 1, projectId: 1 });
    await collection.createIndex({ ownerId: 1, projectId: 1, name: 1 });
  }

  async create(userId: string, character: Character): Promise<Character> {
    if (character.getOwnerId() !== userId) {
      throw new Error('Character owner does not match user');
    }

    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    const doc = serializeCharacter(character);

    await collection.insertOne(doc);
    return character;
  }

  async findById(userId: string, characterId: string): Promise<Character | null> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(characterId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({
      _id: objectId,
      ownerId: userId,
    });

    return doc ? deserializeCharacter(doc) : null;
  }

  async findByProjectId(userId: string, projectId: string): Promise<Character[]> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);

    const docs = await collection
      .find({
        projectId,
        ownerId: userId,
      })
      .sort({ name: 1 })
      .toArray();

    return docs.map(deserializeCharacter);
  }

  async update(userId: string, character: Character): Promise<Character> {
    if (character.getOwnerId() !== userId) {
      throw new Error('Character owner does not match user');
    }

    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    const doc = serializeCharacter(character);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Character not found or access denied');
    }

    return character;
  }

  async delete(userId: string, characterId: string): Promise<void> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(characterId);
    } catch {
      throw new Error('Invalid character ID');
    }

    const result = await collection.deleteOne({
      _id: objectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Character not found or access denied');
    }
  }

  async deleteByProjectId(userId: string, projectId: string): Promise<void> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    await collection.deleteMany({
      projectId,
      ownerId: userId,
    });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }

  async countByProjectId(userId: string, projectId: string): Promise<number> {
    const collection = this.db.collection<CharacterDocument>(COLLECTION_NAME);
    return await collection.countDocuments({
      projectId,
      ownerId: userId,
    });
  }
}
