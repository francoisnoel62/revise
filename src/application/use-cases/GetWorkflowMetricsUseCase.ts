// ABOUTME: Use case computing workflow metrics for a project's objectives dashboard
// ABOUTME: Combines the activity journal, milestone, and quotas into pace, projection, and streak

import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import { QuotaPeriod } from '@/domain/entities/WritingQuota';
import { resolveLocalDate } from '@/lib/local-date';
import {
  getWeekStartLocalDate,
  averageWrittenPerDay,
  requiredDailyPace,
  projectCompletionDate,
  currentDailyStreak,
} from '@/lib/workflow-metrics';
import { GetWritingActivityUseCase, WritingActivityPoint } from './GetWritingActivityUseCase';

const ACTIVITY_WINDOW_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface MilestoneMetrics {
  targetWords: number;
  currentWords: number;
  progress: number;
  remainingWords: number;
  deadline: string | null;
  daysRemaining: number | null;
  requiredDailyPace: number | null;
  projectedCompletionDate: string | null;
  onTrack: boolean | null;
}

export interface QuotaMetrics {
  id: string;
  period: QuotaPeriod;
  targetWords: number;
  writtenInPeriod: number;
  progress: number;
  isMet: boolean;
}

export interface WorkflowMetrics {
  milestone: MilestoneMetrics | null;
  averagePerDay: number;
  quotas: QuotaMetrics[];
  dailyStreak: number;
  dailyStreakTarget: number;
  activity: WritingActivityPoint[];
}

export interface GetWorkflowMetricsInput {
  userId: string;
  projectId: string;
  currentWordCount: number;
  timeZone: string;
  now?: Date;
}

export class GetWorkflowMetricsUseCase {
  constructor(
    private readonly snapshotRepository: WordCountSnapshotRepository,
    private readonly goalRepository: WritingGoalRepository,
    private readonly quotaRepository: WritingQuotaRepository
  ) {}

  async execute(input: GetWorkflowMetricsInput): Promise<WorkflowMetrics> {
    const now = input.now ?? new Date();
    const today = resolveLocalDate(now, input.timeZone);
    const weekStart = getWeekStartLocalDate(today);
    const windowStart = shiftLocalDate(today, -(ACTIVITY_WINDOW_DAYS - 1));

    const [activity, goal, quotas, baselineBeforeToday, baselineBeforeWeek] =
      await Promise.all([
        new GetWritingActivityUseCase(this.snapshotRepository).execute({
          userId: input.userId,
          projectId: input.projectId,
          range: { fromDate: windowStart, toDate: today },
        }),
        this.goalRepository.findActiveByProjectId(input.userId, input.projectId),
        this.quotaRepository.findByProjectId(input.userId, input.projectId),
        this.snapshotRepository.findLatestBefore(input.userId, input.projectId, today),
        this.snapshotRepository.findLatestBefore(input.userId, input.projectId, weekStart),
      ]);

    const averagePerDay = Math.round(averageWrittenPerDay(activity));

    const writtenToday =
      input.currentWordCount - (baselineBeforeToday?.getTotalWords() ?? 0);
    const writtenThisWeek =
      input.currentWordCount - (baselineBeforeWeek?.getTotalWords() ?? 0);

    const quotaMetrics: QuotaMetrics[] = quotas.map((quota) => {
      const writtenInPeriod = quota.getPeriod() === 'daily' ? writtenToday : writtenThisWeek;
      return {
        id: quota.getId(),
        period: quota.getPeriod(),
        targetWords: quota.getTargetWords(),
        writtenInPeriod,
        progress: Math.round(quota.getProgress(writtenInPeriod)),
        isMet: quota.isMet(writtenInPeriod),
      };
    });

    const dailyQuota = quotas.find((q) => q.getPeriod() === 'daily');
    const dailyStreakTarget = dailyQuota ? dailyQuota.getTargetWords() : 1;
    const dailyStreak = currentDailyStreak(activity, dailyStreakTarget);

    let milestone: MilestoneMetrics | null = null;
    if (goal) {
      const remainingWords = goal.getRemainingWords(input.currentWordCount);
      const deadline = goal.getDeadline();
      const daysRemaining = deadline
        ? Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY)
        : null;
      const projectedCompletionDate = projectCompletionDate(
        remainingWords,
        averagePerDay,
        today
      );

      let onTrack: boolean | null = null;
      if (deadline) {
        const deadlineLocalDate = deadline.toISOString().slice(0, 10);
        onTrack =
          projectedCompletionDate !== null &&
          projectedCompletionDate <= deadlineLocalDate;
      }

      milestone = {
        targetWords: goal.getTargetWords(),
        currentWords: input.currentWordCount,
        progress: Math.round(goal.getProgress(input.currentWordCount)),
        remainingWords,
        deadline: deadline ? deadline.toISOString() : null,
        daysRemaining,
        requiredDailyPace:
          daysRemaining !== null ? requiredDailyPace(remainingWords, daysRemaining) : null,
        projectedCompletionDate,
        onTrack,
      };
    }

    return {
      milestone,
      averagePerDay,
      quotas: quotaMetrics,
      dailyStreak,
      dailyStreakTarget,
      activity,
    };
  }
}

function shiftLocalDate(localDate: string, deltaDays: number): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}
