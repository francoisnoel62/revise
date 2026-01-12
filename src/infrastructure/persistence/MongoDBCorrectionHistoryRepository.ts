// ABOUTME: MongoDB implementation of CorrectionHistoryRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId to ensure data isolation.

import { Db, Collection } from 'mongodb';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import { CorrectionHistory } from '@/domain/entities/CorrectionHistory';
import {
  CorrectionHistoryDocument,
  serializeCorrectionHistory,
  deserializeCorrectionHistory,
} from './serialization/correction-history-serializer';

/**
 * MongoDB implementation of CorrectionHistoryRepository.
 * Enforces multi-tenant isolation via ownerId filtering on all queries.
 */
export class MongoDBCorrectionHistoryRepository implements CorrectionHistoryRepository {
  private collection: Collection<CorrectionHistoryDocument>;

  constructor(db: Db) {
    this.collection = db.collection<CorrectionHistoryDocument>('correction_history');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Compound index for listing history by project (sorted by date desc)
    await this.collection.createIndex(
      { projectId: 1, ownerId: 1, createdAt: -1 },
      { name: 'projectId_ownerId_createdAt' }
    );

    // Compound index for listing history by chapter (sorted by date desc)
    await this.collection.createIndex(
      { chapterId: 1, ownerId: 1, createdAt: -1 },
      { name: 'chapterId_ownerId_createdAt' }
    );

    // Index for ownership verification on single lookups
    await this.collection.createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' }
    );
  }

  async save(ownerId: string, history: CorrectionHistory): Promise<void> {
    const doc = serializeCorrectionHistory(history, ownerId);
    await this.collection.insertOne(doc);
  }

  async findByProjectId(ownerId: string, projectId: string): Promise<CorrectionHistory[]> {
    const docs = await this.collection
      .find({ projectId, ownerId })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();

    return docs.map(deserializeCorrectionHistory);
  }

  async findByChapterId(ownerId: string, chapterId: string): Promise<CorrectionHistory[]> {
    const docs = await this.collection
      .find({ chapterId, ownerId })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();

    return docs.map(deserializeCorrectionHistory);
  }

  async findById(ownerId: string, historyId: string): Promise<CorrectionHistory | null> {
    // Always filter by both _id AND ownerId for security
    const doc = await this.collection.findOne({
      _id: historyId,
      ownerId,
    });

    if (!doc) return null;
    return deserializeCorrectionHistory(doc);
  }

  async delete(ownerId: string, historyId: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: historyId,
      ownerId,
    });

    if (result.deletedCount === 0) {
      throw new Error(`Correction history with id ${historyId} not found or not owned`);
    }
  }

  async deleteByChapterId(ownerId: string, chapterId: string): Promise<void> {
    // Delete all history for a chapter (used when deleting chapter)
    await this.collection.deleteMany({
      chapterId,
      ownerId,
    });
  }

  async deleteByProjectId(ownerId: string, projectId: string): Promise<void> {
    // Delete all history for a project (used when deleting project)
    await this.collection.deleteMany({
      projectId,
      ownerId,
    });
  }
}
