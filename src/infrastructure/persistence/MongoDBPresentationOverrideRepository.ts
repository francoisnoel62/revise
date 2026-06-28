// ABOUTME: MongoDB persistence for presentation overrides, keyed by chapterId + ownerId.
// ABOUTME: One document per chapter; upsert on save, findOne on load. Multi-tenant safe.

import { Db, Collection } from 'mongodb';
import type { PresentationOverrideRepository } from '@/domain/interfaces/PresentationOverrideRepository';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

interface PresentationOverrideDocument {
  _id: string;
  ownerId: string;
  overrides: PresentationOverrideLayer;
}

export class MongoDBPresentationOverrideRepository implements PresentationOverrideRepository {
  private collection: Collection<PresentationOverrideDocument>;

  constructor(db: Db) {
    this.collection = db.collection<PresentationOverrideDocument>('presentation_overrides');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'chapterId_ownerId', unique: true }
    );
  }

  async save(chapterId: string, ownerId: string, overrides: PresentationOverrideLayer): Promise<void> {
    await this.collection.replaceOne(
      { _id: chapterId, ownerId },
      { ownerId, overrides } as unknown as PresentationOverrideDocument,
      { upsert: true }
    );
  }

  async load(chapterId: string, ownerId: string): Promise<PresentationOverrideLayer | null> {
    const doc = await this.collection.findOne({ _id: chapterId, ownerId });
    return doc ? doc.overrides : null;
  }

  async delete(chapterId: string, ownerId: string): Promise<void> {
    await this.collection.deleteOne({ _id: chapterId, ownerId });
  }
}
