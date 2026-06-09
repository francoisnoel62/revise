// ABOUTME: Repository interface for AIUsageRecord persistence
// ABOUTME: Defines contract for storing and querying AI usage data

import { AIUsageRecord } from '../entities/AIUsageRecord';
import { AIOperationType } from '../value-objects/AIOperationType';

export interface UsageStats {
  totalOperations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedInputTokens: number;
  totalDurationMs: number;
  totalCostEur: number;
  byOperation: Record<
    AIOperationType,
    {
      count: number;
      inputTokens: number;
      outputTokens: number;
      cachedInputTokens: number;
      costEur: number;
    }
  >;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  operations: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AIUsageRepository {
  save(record: AIUsageRecord): Promise<AIUsageRecord>;

  findByProject(
    userId: string,
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AIUsageRecord[]>;

  getStatsByProject(
    userId: string,
    projectId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<UsageStats>;

  getDailyUsageByProject(
    userId: string,
    projectId: string,
    days: number
  ): Promise<DailyUsage[]>;

  getStatsForUser(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<UsageStats>;

  deleteAllByOwner(userId: string): Promise<void>;
}
