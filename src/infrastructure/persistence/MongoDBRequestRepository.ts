// ABOUTME: MongoDB implementation of AIRequestRepository with multi-tenant support
// ABOUTME: All queries filter by userId to ensure data isolation between users

import { Db, Collection } from 'mongodb';
import { AIRequestRepository } from '@/domain/interfaces/AIRequestRepository';
import { AIRequestRecord } from '@/domain/entities/AIRequestRecord';
import {
  AIRequestDocument,
  serializeRequestRecord,
  deserializeRequestRecord,
} from './serialization/request-record-serializer';

/**
 * MongoDB implementation of AIRequestRepository.
 * Enforces multi-tenant isolation via userId filtering on all queries.
 */
export class MongoDBRequestRepository implements AIRequestRepository {
  private collection: Collection<AIRequestDocument>;

  constructor(db: Db) {
    this.collection = db.collection<AIRequestDocument>('aiRequests');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Compound index for listing by project (newest first)
    await this.collection.createIndex(
      { userId: 1, projectId: 1, createdAt: -1 },
      { name: 'userId_projectId_createdAt' }
    );

    // Index for ownership verification on single lookups
    await this.collection.createIndex(
      { _id: 1, userId: 1 },
      { name: 'id_userId' }
    );
  }

  async save(record: AIRequestRecord): Promise<AIRequestRecord> {
    const doc = serializeRequestRecord(record);
    await this.collection.insertOne(doc);
    return record;
  }

  async findById(userId: string, recordId: string): Promise<AIRequestRecord | null> {
    // Always filter by both _id AND userId for security
    const doc = await this.collection.findOne({
      _id: recordId,
      userId,
    });

    if (!doc) return null;
    return deserializeRequestRecord(doc);
  }

  async findByProject(
    userId: string,
    projectId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<AIRequestRecord[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const docs = await this.collection
      .find({ userId, projectId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map(deserializeRequestRecord);
  }

  async deleteByProjectId(userId: string, projectId: string): Promise<void> {
    await this.collection.deleteMany({ userId, projectId });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    await this.collection.deleteMany({ userId });
  }
}
