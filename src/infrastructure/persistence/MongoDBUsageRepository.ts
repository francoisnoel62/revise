// ABOUTME: MongoDB implementation of AIUsageRepository
// ABOUTME: Provides persistence and aggregation for AI usage tracking with multi-tenant isolation

import { Db } from 'mongodb';
import { AIUsageRepository, UsageStats, DailyUsage } from '@/domain/interfaces/AIUsageRepository';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { AI_OPERATION_TYPES, AIOperationType } from '@/domain/value-objects/AIOperationType';
import {
  AIUsageDocument,
  serializeAIUsage,
  deserializeAIUsage,
} from './ai-usage-serializer';

const COLLECTION_NAME = 'aiUsage';

interface AggregatedStats {
  _id: string;
  count: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  durationMs: number;
}

interface AggregatedDaily {
  _id: string;
  operations: number;
  inputTokens: number;
  outputTokens: number;
}

export class MongoDBUsageRepository implements AIUsageRepository {
  constructor(private readonly db: Db) {}

  async save(record: AIUsageRecord): Promise<AIUsageRecord> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);
    const doc = serializeAIUsage(record);

    await collection.insertOne(doc);
    return record;
  }

  async findByProject(
    userId: string,
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AIUsageRecord[]> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);

    const filter: Record<string, unknown> = {
      userId,
      projectId,
    };

    if (options?.startDate || options?.endDate) {
      filter.createdAt = {};
      if (options.startDate) {
        (filter.createdAt as Record<string, unknown>).$gte = options.startDate;
      }
      if (options.endDate) {
        (filter.createdAt as Record<string, unknown>).$lte = options.endDate;
      }
    }

    let cursor = collection.find(filter).sort({ createdAt: -1 });

    if (options?.offset) {
      cursor = cursor.skip(options.offset);
    }

    if (options?.limit) {
      cursor = cursor.limit(options.limit);
    }

    const docs = await cursor.toArray();
    return docs.map(deserializeAIUsage);
  }

  async getStatsByProject(
    userId: string,
    projectId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<UsageStats> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);

    const matchStage: Record<string, unknown> = {
      userId,
      projectId,
    };

    if (options?.startDate || options?.endDate) {
      matchStage.createdAt = {};
      if (options.startDate) {
        (matchStage.createdAt as Record<string, unknown>).$gte = options.startDate;
      }
      if (options.endDate) {
        (matchStage.createdAt as Record<string, unknown>).$lte = options.endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$operation',
          count: { $sum: 1 },
          inputTokens: { $sum: { $ifNull: ['$inputTokens', 0] } },
          outputTokens: { $sum: { $ifNull: ['$outputTokens', 0] } },
          cachedInputTokens: { $sum: { $ifNull: ['$cachedInputTokens', 0] } },
          durationMs: { $sum: '$durationMs' },
        },
      },
    ];

    const results = await collection.aggregate<AggregatedStats>(pipeline).toArray();

    return this.buildUsageStats(results);
  }

  async getDailyUsageByProject(
    userId: string,
    projectId: string,
    days: number
  ): Promise<DailyUsage[]> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId,
          projectId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          operations: { $sum: 1 },
          inputTokens: { $sum: { $ifNull: ['$inputTokens', 0] } },
          outputTokens: { $sum: { $ifNull: ['$outputTokens', 0] } },
        },
      },
      {
        $sort: { _id: 1 as const },
      },
    ];

    const results = await collection.aggregate<AggregatedDaily>(pipeline).toArray();

    // Fill in missing days with zeros
    const dailyUsage: DailyUsage[] = [];
    const dateMap = new Map<string, DailyUsage>();

    for (const result of results) {
      dateMap.set(result._id as string, {
        date: result._id as string,
        operations: result.operations as number,
        inputTokens: result.inputTokens as number,
        outputTokens: result.outputTokens as number,
      });
    }

    const currentDate = new Date(startDate);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);

      if (existing) {
        dailyUsage.push(existing);
      } else {
        dailyUsage.push({
          date: dateStr,
          operations: 0,
          inputTokens: 0,
          outputTokens: 0,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyUsage;
  }

  async getStatsForUser(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<UsageStats> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);

    const matchStage: Record<string, unknown> = {
      userId,
    };

    if (options?.startDate || options?.endDate) {
      matchStage.createdAt = {};
      if (options.startDate) {
        (matchStage.createdAt as Record<string, unknown>).$gte = options.startDate;
      }
      if (options.endDate) {
        (matchStage.createdAt as Record<string, unknown>).$lte = options.endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$operation',
          count: { $sum: 1 },
          inputTokens: { $sum: { $ifNull: ['$inputTokens', 0] } },
          outputTokens: { $sum: { $ifNull: ['$outputTokens', 0] } },
          cachedInputTokens: { $sum: { $ifNull: ['$cachedInputTokens', 0] } },
          durationMs: { $sum: '$durationMs' },
        },
      },
    ];

    const results = await collection.aggregate<AggregatedStats>(pipeline).toArray();

    return this.buildUsageStats(results);
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<AIUsageDocument>(COLLECTION_NAME);
    await collection.deleteMany({ userId });
  }

  private buildUsageStats(results: AggregatedStats[]): UsageStats {
    const byOperation = {} as UsageStats['byOperation'];

    // Initialize all operation types with zeros
    for (const opType of AI_OPERATION_TYPES) {
      byOperation[opType] = {
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
      };
    }

    let totalOperations = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCachedInputTokens = 0;
    let totalDurationMs = 0;

    for (const result of results) {
      const operation = result._id as AIOperationType;
      if (byOperation[operation]) {
        byOperation[operation] = {
          count: result.count,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          cachedInputTokens: result.cachedInputTokens,
        };
      }

      totalOperations += result.count;
      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;
      totalCachedInputTokens += result.cachedInputTokens;
      totalDurationMs += result.durationMs;
    }

    return {
      totalOperations,
      totalInputTokens,
      totalOutputTokens,
      totalCachedInputTokens,
      totalDurationMs,
      byOperation,
    };
  }
}
