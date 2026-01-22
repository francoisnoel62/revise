// ABOUTME: Server actions for word count snapshot operations
// ABOUTME: Provides API for recording snapshots and calculating period progress

'use server';

import {
  getWordCountSnapshotRepo,
  getIdGenerator,
  getAuthenticatedUserId,
} from './utils';
import { RecordWordCountSnapshotUseCase } from '@/application/use-cases/RecordWordCountSnapshotUseCase';
import { GetPeriodWordCountUseCase } from '@/application/use-cases/GetPeriodWordCountUseCase';
import { GoalType } from '@/domain/entities/WritingGoal';

/**
 * Records a word count snapshot for the current day.
 * This should be called whenever the project's total word count changes.
 */
export async function recordWordCountSnapshotAction(
  projectId: string,
  wordCount: number
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new RecordWordCountSnapshotUseCase(
      await getWordCountSnapshotRepo(),
      await getIdGenerator()
    );

    await useCase.execute({
      userId: authResult.userId,
      projectId,
      wordCount,
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording word count snapshot:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement",
    };
  }
}

export interface PeriodWordCountResult {
  periodWordCount: number;
  periodLabel: string;
}

/**
 * Gets the word count for a specific period type.
 * - 'daily': words written today
 * - 'weekly': words written this week (since Monday)
 * - 'total': total project word count
 */
export async function getPeriodWordCountAction(
  projectId: string,
  periodType: GoalType,
  currentTotalWordCount: number
): Promise<
  { success: true; data: PeriodWordCountResult } | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new GetPeriodWordCountUseCase(
      await getWordCountSnapshotRepo()
    );

    const result = await useCase.execute({
      userId: authResult.userId,
      projectId,
      periodType,
      currentTotalWordCount,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting period word count:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erreur lors du calcul',
    };
  }
}

/**
 * Gets period word counts for multiple goal types at once.
 * More efficient than calling getPeriodWordCountAction multiple times.
 */
export async function getBatchPeriodWordCountsAction(
  projectId: string,
  periodTypes: GoalType[],
  currentTotalWordCount: number
): Promise<
  | { success: true; data: Record<GoalType, PeriodWordCountResult> }
  | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new GetPeriodWordCountUseCase(
      await getWordCountSnapshotRepo()
    );

    const results: Record<string, PeriodWordCountResult> = {};

    for (const periodType of periodTypes) {
      const result = await useCase.execute({
        userId: authResult.userId,
        projectId,
        periodType,
        currentTotalWordCount,
      });
      results[periodType] = result;
    }

    return { success: true, data: results as Record<GoalType, PeriodWordCountResult> };
  } catch (error) {
    console.error('Error getting batch period word counts:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erreur lors du calcul',
    };
  }
}
