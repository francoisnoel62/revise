// ABOUTME: MongoDB implementation of SnapshotRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId; sequence numbers are allocated atomically.

import { Db, Collection } from 'mongodb';
import { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import { Snapshot } from '@/domain/entities/Snapshot';
import { SnapshotDocument, serializeSnapshot, deserializeSnapshot } from './snapshot-serializer';

const COLLECTION_NAME = 'snapshots';
const COUNTERS_COLLECTION_NAME = 'snapshotCounters';

interface SnapshotCounterDocument {
  _id: string; // projectId
  ownerId: string;
  seq: number;
}

export class MongoDBSnapshotRepository implements SnapshotRepository {
  constructor(private readonly db: Db) {}

  private collection(): Collection<SnapshotDocument> {
    return this.db.collection<SnapshotDocument>(COLLECTION_NAME);
  }

  private countersCollection(): Collection<SnapshotCounterDocument> {
    return this.db.collection<SnapshotCounterDocument>(COUNTERS_COLLECTION_NAME);
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    await this.collection().createIndex(
      { projectId: 1, ownerId: 1, number: -1 },
      { name: 'projectId_ownerId_number' }
    );
    await this.collection().createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' }
    );
  }

  async getNextSequenceNumber(ownerId: string, projectId: string): Promise<number> {
    const doc = await this.countersCollection().findOneAndUpdate(
      { _id: projectId, ownerId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    // returnDocument: 'after' with upsert always yields a document.
    return doc!.seq;
  }

  async save(ownerId: string, snapshot: Snapshot): Promise<void> {
    if (snapshot.getOwnerId() !== ownerId) {
      throw new Error('Snapshot ownerId does not match ownerId');
    }

    const doc = serializeSnapshot(snapshot);
    await this.collection().insertOne(doc);
  }

  async findByProjectId(ownerId: string, projectId: string): Promise<Snapshot[]> {
    const docs = await this.collection()
      .find({ projectId, ownerId })
      .sort({ number: -1 })
      .toArray();

    return docs.map(deserializeSnapshot);
  }

  async findLatestByProjectId(ownerId: string, projectId: string): Promise<Snapshot | null> {
    const docs = await this.collection()
      .find({ projectId, ownerId })
      .sort({ number: -1 })
      .limit(1)
      .toArray();

    if (docs.length === 0) return null;
    return deserializeSnapshot(docs[0]);
  }

  async findById(ownerId: string, snapshotId: string): Promise<Snapshot | null> {
    const doc = await this.collection().findOne({ _id: snapshotId, ownerId });

    if (!doc) return null;
    return deserializeSnapshot(doc);
  }

  async deleteByProjectId(ownerId: string, projectId: string): Promise<void> {
    await this.collection().deleteMany({ projectId, ownerId });
    await this.countersCollection().deleteMany({ _id: projectId, ownerId });
  }

  async deleteAllByOwner(ownerId: string): Promise<number> {
    const result = await this.collection().deleteMany({ ownerId });
    await this.countersCollection().deleteMany({ ownerId });
    return result.deletedCount;
  }
}
