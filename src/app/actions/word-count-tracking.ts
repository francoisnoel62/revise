// ABOUTME: Best-effort recording of a project's daily word count snapshot
// ABOUTME: Feeds the writing activity journal that daily/weekly quotas and metrics build on

import { getWordCountSnapshotRepo, getIdGenerator } from './utils';
import { RecordWordCountSnapshotUseCase } from '@/application/use-cases/RecordWordCountSnapshotUseCase';
import { resolveLocalDate } from '@/lib/local-date';

/**
 * Record the project's current total word count for the author's local day.
 * Best-effort: a failure here must never break the operation that triggered it,
 * so errors are logged and swallowed.
 */
export async function recordWordCountSnapshot(
  userId: string,
  projectId: string,
  totalWords: number,
  timeZone: string,
  previousTotalWords?: number
): Promise<void> {
  try {
    const useCase = new RecordWordCountSnapshotUseCase(
      await getWordCountSnapshotRepo(),
      await getIdGenerator()
    );

    await useCase.execute({
      userId,
      projectId,
      localDate: resolveLocalDate(new Date(), timeZone),
      totalWords,
      previousTotalWords,
    });
  } catch (error) {
    console.error('Failed to record word count snapshot:', error);
  }
}
