// ABOUTME: MongoDB implementation of BlogArticleRepository.
// ABOUTME: Public reads without auth, admin writes verified in server actions.

import { Db, Collection } from 'mongodb';
import { BlogArticleRepository } from '@/domain/interfaces/BlogArticleRepository';
import { BlogArticle } from '@/domain/entities/BlogArticle';
import {
  BlogArticleDocument,
  serializeBlogArticle,
  deserializeBlogArticle,
} from './serialization/blog-article-serializer';

/**
 * MongoDB implementation of BlogArticleRepository.
 * Blog articles are public content - no ownerId filtering on reads.
 * Admin checks are performed in server actions, not here.
 */
export class MongoDBBlogArticleRepository implements BlogArticleRepository {
  private collection: Collection<BlogArticleDocument>;

  constructor(db: Db) {
    this.collection = db.collection<BlogArticleDocument>('blog_articles');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Unique index on slug for URL lookups
    await this.collection.createIndex({ slug: 1 }, { unique: true });

    // Compound index for listing published articles sorted by date
    await this.collection.createIndex({ isPublished: 1, publishedAt: -1 });

    // Index for listing all articles sorted by update date (admin)
    await this.collection.createIndex({ updatedAt: -1 });
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  async findBySlug(slug: string): Promise<BlogArticle | null> {
    const doc = await this.collection.findOne({
      slug: slug.toLowerCase(),
      isPublished: true,
    });

    if (!doc) return null;
    return deserializeBlogArticle(doc);
  }

  async findAllPublished(): Promise<BlogArticle[]> {
    const docs = await this.collection
      .find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .toArray();

    return docs.map(deserializeBlogArticle);
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  async create(article: BlogArticle): Promise<BlogArticle> {
    const doc = serializeBlogArticle(article);

    try {
      await this.collection.insertOne(doc);
      return article;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error(`Article with slug "${article.getSlug()}" already exists`);
      }
      throw error;
    }
  }

  async update(article: BlogArticle): Promise<BlogArticle> {
    const doc = serializeBlogArticle(article);

    const result = await this.collection.replaceOne({ _id: article.getId() }, doc);

    if (result.matchedCount === 0) {
      throw new Error(`Article with id ${article.getId()} not found`);
    }

    return article;
  }

  async delete(articleId: string): Promise<void> {
    const result = await this.collection.deleteOne({ _id: articleId });

    if (result.deletedCount === 0) {
      throw new Error(`Article with id ${articleId} not found`);
    }
  }

  async findById(articleId: string): Promise<BlogArticle | null> {
    const doc = await this.collection.findOne({ _id: articleId });

    if (!doc) return null;
    return deserializeBlogArticle(doc);
  }

  async findAll(): Promise<BlogArticle[]> {
    const docs = await this.collection.find({}).sort({ updatedAt: -1 }).toArray();

    return docs.map(deserializeBlogArticle);
  }

  async slugExists(slug: string, excludeArticleId?: string): Promise<boolean> {
    const query: { slug: string; _id?: { $ne: string } } = {
      slug: slug.toLowerCase(),
    };

    if (excludeArticleId) {
      query._id = { $ne: excludeArticleId };
    }

    const count = await this.collection.countDocuments(query);
    return count > 0;
  }
}
