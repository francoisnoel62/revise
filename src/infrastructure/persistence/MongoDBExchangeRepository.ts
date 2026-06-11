// ABOUTME: MongoDB implementation of AIExchangeRepository with at-rest content encryption
// ABOUTME: Enforces ownerId isolation, metadata-only list queries, and TTL-based automatic purge

import { Db } from 'mongodb';
import { AIExchange } from '@/domain/entities/AIExchange';
import {
  AIExchangeRepository,
  AIExchangeFilters,
  AIExchangeSummary,
} from '@/domain/interfaces/AIExchangeRepository';
import { FieldEncryption } from '@/infrastructure/security/FieldEncryption';
import {
  AIExchangeDocument,
  serializeAIExchange,
  deserializeAIExchange,
  toAIExchangeSummary,
} from './ai-exchange-serializer';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'aiExchanges';

export class MongoDBExchangeRepository implements AIExchangeRepository {
  constructor(
    private readonly db: Db,
    private readonly encryption: FieldEncryption
  ) {}

  private collection() {
    return this.db.collection<AIExchangeDocument>(COLLECTION_NAME);
  }

  async ensureIndexes(): Promise<void> {
    const collection = this.collection();
    await collection.createIndex({ userId: 1, createdAt: -1 });
    await collection.createIndex({ userId: 1, projectId: 1, createdAt: -1 });
    await collection.createIndex({ userId: 1, operation: 1 });
    // TTL index: documents are purged automatically once expiresAt passes.
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  async save(exchange: AIExchange): Promise<AIExchange> {
    const doc = serializeAIExchange(exchange, this.encryption);
    await this.collection().insertOne(doc);
    return exchange;
  }

  async findByOwner(
    userId: string,
    filters?: AIExchangeFilters
  ): Promise<AIExchangeSummary[]> {
    const filter: Record<string, unknown> = { userId };

    if (filters?.projectId) {
      filter.projectId = filters.projectId;
    }
    if (filters?.operation) {
      filter.operation = filters.operation;
    }
    if (filters?.model) {
      filter.model = filters.model;
    }
    if (filters?.startDate || filters?.endDate) {
      const range: Record<string, unknown> = {};
      if (filters.startDate) {
        range.$gte = filters.startDate;
      }
      if (filters.endDate) {
        range.$lte = filters.endDate;
      }
      filter.createdAt = range;
    }

    let cursor = this.collection().find(filter).sort({ createdAt: -1 });

    if (filters?.offset) {
      cursor = cursor.skip(filters.offset);
    }
    if (filters?.limit) {
      cursor = cursor.limit(filters.limit);
    }

    const docs = await cursor.toArray();
    return docs.map(toAIExchangeSummary);
  }

  async findById(userId: string, id: string): Promise<AIExchange | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const doc = await this.collection().findOne({
      _id: new ObjectId(id),
      userId,
    });

    if (!doc) {
      return null;
    }

    return deserializeAIExchange(doc, this.encryption);
  }

  async distinctModels(userId: string): Promise<string[]> {
    const models = await this.collection().distinct('model', { userId });
    return models.filter((m): m is string => typeof m === 'string').sort();
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    await this.collection().deleteMany({ userId });
  }
}
