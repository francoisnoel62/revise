// ABOUTME: MongoDB implementation of SnapshotRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId; sequence numbers are allocated atomically.

import { Db, Collection } from 'mongodb';
import { SnapshotRepository, SnapshotPageQuery, SnapshotPage, SnapshotActivity } from '@/domain/interfaces/SnapshotRepository';
import { Snapshot } from '@/domain/entities/Snapshot';
import { SnapshotDocument, serializeSnapshot, deserializeSnapshot } from './snapshot-serializer';

const COLLECTION_NAME = 'snapshots';
const COUNTERS_COLLECTION_NAME = 'snapshotCounters';
const ACTIVITY_COLLECTION_NAME = 'snapshotActivity';

const DUPLICATE_KEY_ERROR_CODE = 11000;

/** How many times a counter allocation may lose the insert race before giving up. */
const SEQUENCE_ALLOCATION_RETRIES = 5;

interface SnapshotCounterDocument {
  _id: string; // projectId
  ownerId: string;
  seq: number;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR_CODE
  );
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
    // Concurrent first-ever allocations for the same project all miss the filter and race to
    // insert the counter; every loser gets a duplicate-key error on _id. Retrying resolves it:
    // the counter now exists, so the next attempt matches and increments instead of inserting.
    for (let attempt = 0; ; attempt++) {
      try {
        const doc = await this.countersCollection().findOneAndUpdate(
          { _id: projectId, ownerId },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' }
        );

        // returnDocument: 'after' with upsert always yields a document.
        return doc!.seq;
      } catch (error) {
        if (!isDuplicateKeyError(error) || attempt >= SEQUENCE_ALLOCATION_RETRIES) throw error;
      }
    }
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

  async updateMetadata(ownerId: string, snapshot: Snapshot): Promise<void> {
    const result = await this.collection().updateOne(
      { _id: snapshot.getId(), ownerId, deletedAt: { $in: [null, undefined] } },
      { $set: { title: snapshot.getTitle(), comment: snapshot.getComment() } },
    );
    if (result.matchedCount === 0) throw new Error('Snapshot introuvable ou supprimé');
  }

  async tombstone(ownerId: string, snapshot: Snapshot): Promise<void> {
    const result = await this.collection().updateOne(
      { _id: snapshot.getId(), ownerId, deletedAt: { $in: [null, undefined] } },
      { $set: { chapters: [], editorialMetadata: null, deletedAt: snapshot.getDeletedAt(), deletedById: snapshot.getDeletedById() } },
    );
    if (result.matchedCount === 0) throw new Error('Snapshot introuvable ou déjà supprimé');
  }

  async recordActivity(activity: SnapshotActivity): Promise<void> {
    await this.db.collection<SnapshotActivity>(ACTIVITY_COLLECTION_NAME).insertOne(activity);
  }

  async findPageByProjectId(
    ownerId: string,
    projectId: string,
    query: SnapshotPageQuery
  ): Promise<SnapshotPage> {
    const filter: Record<string, unknown> = { projectId, ownerId };
    if (query.type) filter.type = query.type;
    if (query.authorId) filter.authorId = query.authorId;
    if (query.beforeNumber) filter.number = { $lt: query.beforeNumber };
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lte: query.to } : {}),
      };
    }

    const docs = await this.collection()
      .find(filter)
      .sort({ number: -1 })
      .limit(query.limit + 1)
      .toArray();
    const hasMore = docs.length > query.limit;
    const pageDocs = hasMore ? docs.slice(0, query.limit) : docs;
    const last = pageDocs.at(-1);

    return {
      snapshots: pageDocs.map(deserializeSnapshot),
      nextBeforeNumber: hasMore && last ? last.number : null,
    };
  }

  async deleteByIds(ownerId: string, snapshotIds: string[]): Promise<number> {
    if (snapshotIds.length === 0) return 0;
    const result = await this.collection().deleteMany({
      ownerId,
      _id: { $in: snapshotIds },
      type: 'automatic',
    });
    return result.deletedCount;
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
