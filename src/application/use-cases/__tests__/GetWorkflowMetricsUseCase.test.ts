// ABOUTME: Tests for GetWorkflowMetricsUseCase
// ABOUTME: Verifies milestone pace/projection, real per-period quota progress, and streak

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetWorkflowMetricsUseCase } from '../GetWorkflowMetricsUseCase';
import { WritingGoal } from '@/domain/entities/WritingGoal';
import { WritingQuota } from '@/domain/entities/WritingQuota';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';

const snap = (localDate: string, totalWords: number) =>
  WordCountSnapshot.reconstruct({
    id: '507f1f77bcf86cd799439011',
    projectId: 'project-1',
    ownerId: 'user-1',
    localDate,
    totalWords,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('GetWorkflowMetricsUseCase', () => {
  let snapshotRepo: {
    findByProjectId: ReturnType<typeof vi.fn>;
    findLatestBefore: ReturnType<typeof vi.fn>;
    upsertForDay: ReturnType<typeof vi.fn>;
    deleteAllByOwner: ReturnType<typeof vi.fn>;
  };
  let goalRepo: { findActiveByProjectId: ReturnType<typeof vi.fn> };
  let quotaRepo: { findByProjectId: ReturnType<typeof vi.fn> };
  let useCase: GetWorkflowMetricsUseCase;

  beforeEach(() => {
    snapshotRepo = {
      findByProjectId: vi.fn().mockResolvedValue([
        snap('2026-05-29', 59700),
        snap('2026-05-30', 60900),
        snap('2026-05-31', 62400),
      ]),
      findLatestBefore: vi.fn((_u, _p, date: string) => {
        if (date === '2026-05-31') return Promise.resolve(snap('2026-05-30', 60900));
        if (date === '2026-05-25') return Promise.resolve(snap('2026-05-23', 58000));
        return Promise.resolve(null); // window baseline
      }),
      upsertForDay: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };
    goalRepo = {
      findActiveByProjectId: vi
        .fn()
        .mockResolvedValue(
          WritingGoal.create('g-1', 'project-1', 'user-1', 80000, new Date('2026-06-10'))
        ),
    };
    quotaRepo = {
      findByProjectId: vi.fn().mockResolvedValue([
        WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000),
        WritingQuota.create('q-2', 'project-1', 'user-1', 'weekly', 5000),
      ]),
    };

    useCase = new GetWorkflowMetricsUseCase(
      snapshotRepo as never,
      goalRepo as never,
      quotaRepo as never
    );
  });

  const run = () =>
    useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      currentWordCount: 62400,
      timeZone: 'UTC',
      now: new Date('2026-05-31T12:00:00.000Z'),
    });

  it('computes milestone progress, remaining words, required pace and projection', async () => {
    const result = await run();

    expect(result.milestone).not.toBeNull();
    expect(result.milestone!.targetWords).toBe(80000);
    expect(result.milestone!.progress).toBe(78);
    expect(result.milestone!.remainingWords).toBe(17600);
    expect(result.milestone!.daysRemaining).toBe(10);
    expect(result.milestone!.requiredDailyPace).toBe(1760);
    expect(result.milestone!.projectedCompletionDate).toBe('2026-06-14');
    expect(result.milestone!.onTrack).toBe(false);
  });

  it('computes the recent average words per day', async () => {
    const result = await run();
    // window written deltas: 2026-05-30 (+1200), 2026-05-31 (+1500); first point has no baseline
    expect(result.averagePerDay).toBe(1350);
  });

  it('computes real per-period quota progress against words written in the period', async () => {
    const result = await run();

    const daily = result.quotas.find((q) => q.period === 'daily')!;
    expect(daily.writtenInPeriod).toBe(1500); // 62400 - 60900
    expect(daily.progress).toBe(100);
    expect(daily.isMet).toBe(true);

    const weekly = result.quotas.find((q) => q.period === 'weekly')!;
    expect(weekly.writtenInPeriod).toBe(4400); // 62400 - 58000
    expect(weekly.progress).toBe(88);
    expect(weekly.isMet).toBe(false);
  });

  it('computes the daily streak against the daily quota target', async () => {
    const result = await run();
    expect(result.dailyStreakTarget).toBe(1000);
    expect(result.dailyStreak).toBe(2); // 31 and 30 met 1000; 29 has no measured delta
  });

  it('returns a null milestone when no goal is set', async () => {
    goalRepo.findActiveByProjectId.mockResolvedValue(null);
    const result = await run();
    expect(result.milestone).toBeNull();
  });
});
