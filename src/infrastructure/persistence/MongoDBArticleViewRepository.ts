// ABOUTME: MongoDB implementation of ArticleViewRepository.
// ABOUTME: Tracks visitor fingerprints with TTL index for automatic cleanup.

import { Db, Collection } from 'mongodb';
import { ArticleViewRepository } from '@/domain/interfaces/ArticleViewRepository';
import { ArticleView } from '@/domain/entities/ArticleView';
import {
  ArticleViewDocument,
  serializeArticleView,
} from './serialization/article-view-serializer';

const VIEW_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * MongoDB implementation of ArticleViewRepository.
 * Uses TTL index for automatic cleanup of old view records.
 */
export class MongoDBArticleViewRepository implements ArticleViewRepository {
  private collection: Collection<ArticleViewDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ArticleViewDocument>('article_views');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Compound index for checking existing views
    await this.collection.createIndex(
      { articleId: 1, visitorHash: 1 },
      { unique: true }
    );

    // TTL index for automatic cleanup after 24 hours
    await this.collection.createIndex(
      { viewedAt: 1 },
      { expireAfterSeconds: VIEW_TTL_SECONDS }
    );
  }

  async hasRecentView(articleId: string, visitorHash: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      articleId,
      visitorHash,
    });
    return count > 0;
  }

  async create(view: ArticleView): Promise<void> {
    const doc = serializeArticleView(view);

    try {
      await this.collection.insertOne(doc);
    } catch (error: unknown) {
      // Ignore duplicate key errors - visitor already recorded
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return;
      }
      throw error;
    }
  }

  async deleteOlderThan(olderThan: Date): Promise<number> {
    const result = await this.collection.deleteMany({
      viewedAt: { $lt: olderThan },
    });
    return result.deletedCount;
  }
}
