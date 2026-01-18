// ABOUTME: MongoDB implementation of SpellCheckCacheRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId to ensure data isolation.

import { Db, Collection } from 'mongodb';
import { SpellCheckCacheRepository } from '@/domain/interfaces/SpellCheckCacheRepository';
import { SpellCheckCache } from '@/domain/entities/SpellCheckCache';
import {
  SpellCheckCacheDocument,
  serializeSpellCheckCache,
  deserializeSpellCheckCache,
} from './serialization/spellcheck-cache-serializer';

/**
 * MongoDB implementation of SpellCheckCacheRepository.
 * Enforces multi-tenant isolation via ownerId filtering on all queries.
 */
export class MongoDBSpellCheckCacheRepository implements SpellCheckCacheRepository {
  private collection: Collection<SpellCheckCacheDocument>;

  constructor(db: Db) {
    this.collection = db.collection<SpellCheckCacheDocument>('spellcheck_cache');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Unique index for chapter (only one cache per chapter per owner)
    await this.collection.createIndex(
      { chapterId: 1, ownerId: 1 },
      { name: 'chapterId_ownerId', unique: true }
    );

    // Index for project-level operations
    await this.collection.createIndex(
      { projectId: 1, ownerId: 1 },
      { name: 'projectId_ownerId' }
    );

    // Index for ownership verification on single lookups
    await this.collection.createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' }
    );
  }

  async save(ownerId: string, cache: SpellCheckCache): Promise<void> {
    const doc = serializeSpellCheckCache(cache, ownerId);

    // Use upsert to replace existing cache for the same chapter
    await this.collection.replaceOne(
      { chapterId: cache.getChapterId(), ownerId },
      doc,
      { upsert: true }
    );
  }

  async findByChapterId(ownerId: string, chapterId: string): Promise<SpellCheckCache | null> {
    const doc = await this.collection.findOne({
      chapterId,
      ownerId,
    });

    if (!doc) return null;
    return deserializeSpellCheckCache(doc);
  }

  async findById(ownerId: string, cacheId: string): Promise<SpellCheckCache | null> {
    const doc = await this.collection.findOne({
      _id: cacheId,
      ownerId,
    });

    if (!doc) return null;
    return deserializeSpellCheckCache(doc);
  }

  async deleteByChapterId(ownerId: string, chapterId: string): Promise<void> {
    await this.collection.deleteOne({
      chapterId,
      ownerId,
    });
  }

  async deleteByProjectId(ownerId: string, projectId: string): Promise<void> {
    await this.collection.deleteMany({
      projectId,
      ownerId,
    });
  }

  async deleteAllByOwner(ownerId: string): Promise<number> {
    const result = await this.collection.deleteMany({
      ownerId,
    });
    return result.deletedCount;
  }

  async update(ownerId: string, cache: SpellCheckCache): Promise<void> {
    const doc = serializeSpellCheckCache(cache, ownerId);

    const result = await this.collection.replaceOne(
      { _id: cache.getId(), ownerId },
      doc
    );

    if (result.matchedCount === 0) {
      throw new Error(`SpellCheckCache with id ${cache.getId()} not found or not owned`);
    }
  }
}
