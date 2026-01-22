// ABOUTME: MongoDB implementation of WordCountSnapshotRepository
// ABOUTME: Provides persistence for daily word count snapshots with multi-tenant isolation

import { Db } from 'mongodb';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import {
  WordCountSnapshot,
  normalizeToParisDate,
} from '@/domain/entities/WordCountSnapshot';
import {
  WordCountSnapshotDocument,
  serializeWordCountSnapshot,
  deserializeWordCountSnapshot,
} from './word-count-snapshot-serializer';

const COLLECTION_NAME = 'wordCountSnapshots';

export class MongoDBWordCountSnapshotRepository
  implements WordCountSnapshotRepository
{
  constructor(private readonly db: Db) {}

  async upsert(
    userId: string,
    snapshot: WordCountSnapshot
  ): Promise<WordCountSnapshot> {
    if (snapshot.getOwnerId() !== userId) {
      throw new Error('Snapshot owner does not match user');
    }

    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    const doc = serializeWordCountSnapshot(snapshot);
    const normalizedDate = normalizeToParisDate(snapshot.getDate());

    // Try to find existing snapshot for this project and date
    const existing = await collection.findOne({
      projectId: snapshot.getProjectId(),
      ownerId: userId,
      date: normalizedDate,
    });

    if (existing) {
      // Update existing snapshot
      await collection.updateOne(
        { _id: existing._id },
        { $set: { wordCount: snapshot.getWordCount() } }
      );
      return WordCountSnapshot.reconstruct({
        id: existing._id.toHexString(),
        projectId: snapshot.getProjectId(),
        ownerId: userId,
        date: normalizedDate,
        wordCount: snapshot.getWordCount(),
        createdAt: existing.createdAt,
      });
    } else {
      // Insert new snapshot
      await collection.insertOne({
        ...doc,
        date: normalizedDate,
      });
      return snapshot;
    }
  }

  async findByDate(
    userId: string,
    projectId: string,
    date: Date
  ): Promise<WordCountSnapshot | null> {
    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    const normalizedDate = normalizeToParisDate(date);

    const doc = await collection.findOne({
      projectId,
      ownerId: userId,
      date: normalizedDate,
    });

    return doc ? deserializeWordCountSnapshot(doc) : null;
  }

  async findLatestBefore(
    userId: string,
    projectId: string,
    beforeDate: Date
  ): Promise<WordCountSnapshot | null> {
    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    const normalizedDate = normalizeToParisDate(beforeDate);

    const doc = await collection.findOne(
      {
        projectId,
        ownerId: userId,
        date: { $lt: normalizedDate },
      },
      { sort: { date: -1 } }
    );

    return doc ? deserializeWordCountSnapshot(doc) : null;
  }

  async findByDateRange(
    userId: string,
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WordCountSnapshot[]> {
    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    const normalizedStart = normalizeToParisDate(startDate);
    const normalizedEnd = normalizeToParisDate(endDate);

    const docs = await collection
      .find({
        projectId,
        ownerId: userId,
        date: { $gte: normalizedStart, $lte: normalizedEnd },
      })
      .sort({ date: 1 })
      .toArray();

    return docs.map(deserializeWordCountSnapshot);
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }

  async deleteAllByProject(userId: string, projectId: string): Promise<void> {
    const collection =
      this.db.collection<WordCountSnapshotDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId, projectId });
  }
}
