// ABOUTME: Use case for calculating word count for a specific period
// ABOUTME: Returns words written today, this week, or total based on goal type

import { GoalType } from '@/domain/entities/WritingGoal';
import {
  normalizeToParisDate,
  getWeekStartParis,
} from '@/domain/entities/WordCountSnapshot';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';

export interface GetPeriodWordCountInput {
  userId: string;
  projectId: string;
  periodType: GoalType;
  currentTotalWordCount: number;
}

export interface GetPeriodWordCountResult {
  periodWordCount: number;
  periodLabel: string;
}

export class GetPeriodWordCountUseCase {
  constructor(private readonly repository: WordCountSnapshotRepository) {}

  async execute(input: GetPeriodWordCountInput): Promise<GetPeriodWordCountResult> {
    const { userId, projectId, periodType, currentTotalWordCount } = input;

    // For 'total' type, just return the current total
    if (periodType === 'total') {
      return {
        periodWordCount: currentTotalWordCount,
        periodLabel: 'Total du projet',
      };
    }

    const now = new Date();
    const today = normalizeToParisDate(now);

    if (periodType === 'daily') {
      // Find snapshot from yesterday (or latest before today)
      const yesterdaySnapshot = await this.repository.findLatestBefore(
        userId,
        projectId,
        today
      );

      const baseWordCount = yesterdaySnapshot?.getWordCount() ?? 0;
      const wordsWrittenToday = Math.max(0, currentTotalWordCount - baseWordCount);

      return {
        periodWordCount: wordsWrittenToday,
        periodLabel: "Aujourd'hui",
      };
    }

    if (periodType === 'weekly') {
      // Find snapshot from before this week started (Monday)
      const weekStart = getWeekStartParis(now);
      const beforeWeekSnapshot = await this.repository.findLatestBefore(
        userId,
        projectId,
        weekStart
      );

      const baseWordCount = beforeWeekSnapshot?.getWordCount() ?? 0;
      const wordsWrittenThisWeek = Math.max(0, currentTotalWordCount - baseWordCount);

      return {
        periodWordCount: wordsWrittenThisWeek,
        periodLabel: 'Cette semaine',
      };
    }

    // Fallback (should never happen)
    return {
      periodWordCount: currentTotalWordCount,
      periodLabel: 'Total',
    };
  }
}
