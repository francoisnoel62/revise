// ABOUTME: Server actions for AI usage tracking and statistics
// ABOUTME: Provides data for cockpit usage dashboard

'use server';

import {
  getAuthenticatedUserId,
  getAIUsageRepo,
  ActionResult,
  withErrorHandling,
} from './utils';
import { UsageStats, DailyUsage } from '@/domain/interfaces/AIUsageRepository';

/**
 * Get usage statistics for a specific project.
 */
export async function getProjectUsageStatsAction(
  projectId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ActionResult<UsageStats>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIUsageRepo();
    return repo.getStatsByProject(auth.userId, projectId, options);
  });
}

/**
 * Get daily usage for a project over the past N days.
 */
export async function getProjectDailyUsageAction(
  projectId: string,
  days: number = 30
): Promise<ActionResult<DailyUsage[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIUsageRepo();
    return repo.getDailyUsageByProject(auth.userId, projectId, days);
  });
}

/**
 * Get usage statistics for the current user across all projects.
 */
export async function getUserUsageStatsAction(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<UsageStats>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIUsageRepo();
    return repo.getStatsForUser(auth.userId, options);
  });
}

/**
 * Serialize UsageStats for client-side use.
 * Converts any non-serializable types.
 */
export async function serializeUsageStats(stats: UsageStats): Promise<UsageStats> {
  return {
    ...stats,
    byOperation: { ...stats.byOperation },
  };
}

/**
 * Serialize DailyUsage array for client-side use.
 */
export async function serializeDailyUsage(usage: DailyUsage[]): Promise<DailyUsage[]> {
  return usage.map((day) => ({
    ...day,
    date: day.date,
  }));
}
