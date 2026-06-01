// ABOUTME: MongoDB implementation of WordCountSnapshotRepository
// ABOUTME: Stores one word count snapshot per owner/project/author-local day

import { Db, Collection } from 'mongodb';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import {
  WordCountSnapshotDocument,
  serializeWordCountSnapshot,
  deserializeWordCountSnapshot,
} from './word-count-snapshot-serializer';

const COLLECTION_NAME = 'wordCountSnapshots';

export class MongoDBWordCountSnapshotRepository
  implements WordCountSnapshotRepository
{
  private collection: Collection<WordCountSnapshotDocument>;

  constructor(db: Db) {
    this.collection = db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { ownerId: 1, projectId: 1, localDate: 1 },
      { unique: true }
    );
  }

  async upsertForDay(
    userId: string,
    snapshot: WordCountSnapshot
  ): Promise<WordCountSnapshot> {
    if (snapshot.getOwnerId() !== userId) {
      throw new Error('Snapshot owner does not match user');
    }

    const doc = serializeWordCountSnapshot(snapshot);
    const filter = {
      ownerId: userId,
      projectId: snapshot.getProjectId(),
      localDate: snapshot.getLocalDate(),
    };

    await this.collection.updateOne(
      filter,
      {
        $set: {
          totalWords: doc.totalWords,
          updatedAt: doc.updatedAt,
        },
        $setOnInsert: {
          _id: doc._id,
          projectId: doc.projectId,
          ownerId: doc.ownerId,
          localDate: doc.localDate,
          createdAt: doc.createdAt,
        },
      },
      { upsert: true }
    );

    const persisted = await this.collection.findOne(filter);
    return persisted ? deserializeWordCountSnapshot(persisted) : snapshot;
  }

  async findByProjectId(
    userId: string,
    projectId: string,
    range?: { fromDate?: string; toDate?: string }
  ): Promise<WordCountSnapshot[]> {
    const query: Record<string, unknown> = { ownerId: userId, projectId };

    if (range?.fromDate || range?.toDate) {
      const localDate: Record<string, string> = {};
      if (range.fromDate) localDate.$gte = range.fromDate;
      if (range.toDate) localDate.$lte = range.toDate;
      query.localDate = localDate;
    }

    const docs = await this.collection
      .find(query)
      .sort({ localDate: 1 })
      .toArray();

    return docs.map(deserializeWordCountSnapshot);
  }

  async findLatestBefore(
    userId: string,
    projectId: string,
    localDate: string
  ): Promise<WordCountSnapshot | null> {
    const doc = await this.collection.findOne(
      { ownerId: userId, projectId, localDate: { $lt: localDate } },
      { sort: { localDate: -1 } }
    );

    return doc ? deserializeWordCountSnapshot(doc) : null;
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    await this.collection.deleteMany({ ownerId: userId });
  }
}
