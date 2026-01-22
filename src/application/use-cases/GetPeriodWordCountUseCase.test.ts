// ABOUTME: Tests for GetPeriodWordCountUseCase
// ABOUTME: Verifies correct calculation of daily, weekly, and total word counts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPeriodWordCountUseCase } from './GetPeriodWordCountUseCase';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';

describe('GetPeriodWordCountUseCase', () => {
  let useCase: GetPeriodWordCountUseCase;
  let mockRepository: {
    findLatestBefore: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findLatestBefore: vi.fn(),
    };

    useCase = new GetPeriodWordCountUseCase(
      mockRepository as unknown as WordCountSnapshotRepository
    );
  });

  describe('total type', () => {
    it('returns current total word count directly', async () => {
      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'total',
        currentTotalWordCount: 50000,
      });

      expect(result.periodWordCount).toBe(50000);
      expect(result.periodLabel).toBe('Total du projet');
      expect(mockRepository.findLatestBefore).not.toHaveBeenCalled();
    });
  });

  describe('daily type', () => {
    it('returns words written today when snapshot exists', async () => {
      // Yesterday's snapshot had 1000 words, current total is 1500
      const yesterdaySnapshot = WordCountSnapshot.create(
        'snapshot-1',
        'project-1',
        'user-1',
        1000,
        new Date('2026-01-21T12:00:00.000Z')
      );

      mockRepository.findLatestBefore.mockResolvedValue(yesterdaySnapshot);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'daily',
        currentTotalWordCount: 1500,
      });

      expect(result.periodWordCount).toBe(500);
      expect(result.periodLabel).toBe("Aujourd'hui");
    });

    it('returns current total when no previous snapshot exists', async () => {
      mockRepository.findLatestBefore.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'daily',
        currentTotalWordCount: 1500,
      });

      expect(result.periodWordCount).toBe(1500);
      expect(result.periodLabel).toBe("Aujourd'hui");
    });

    it('returns 0 when word count decreased (deleted content)', async () => {
      const yesterdaySnapshot = WordCountSnapshot.create(
        'snapshot-1',
        'project-1',
        'user-1',
        2000,
        new Date('2026-01-21T12:00:00.000Z')
      );

      mockRepository.findLatestBefore.mockResolvedValue(yesterdaySnapshot);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'daily',
        currentTotalWordCount: 1500,
      });

      // Should not show negative progress
      expect(result.periodWordCount).toBe(0);
    });
  });

  describe('weekly type', () => {
    it('returns words written this week when snapshot exists', async () => {
      // Last week's snapshot had 5000 words, current total is 7500
      const lastWeekSnapshot = WordCountSnapshot.create(
        'snapshot-1',
        'project-1',
        'user-1',
        5000,
        new Date('2026-01-18T12:00:00.000Z') // Saturday before the week
      );

      mockRepository.findLatestBefore.mockResolvedValue(lastWeekSnapshot);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'weekly',
        currentTotalWordCount: 7500,
      });

      expect(result.periodWordCount).toBe(2500);
      expect(result.periodLabel).toBe('Cette semaine');
    });

    it('returns current total when no previous snapshot exists', async () => {
      mockRepository.findLatestBefore.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'weekly',
        currentTotalWordCount: 3000,
      });

      expect(result.periodWordCount).toBe(3000);
      expect(result.periodLabel).toBe('Cette semaine');
    });

    it('returns 0 when word count decreased', async () => {
      const lastWeekSnapshot = WordCountSnapshot.create(
        'snapshot-1',
        'project-1',
        'user-1',
        5000
      );

      mockRepository.findLatestBefore.mockResolvedValue(lastWeekSnapshot);

      const result = await useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        periodType: 'weekly',
        currentTotalWordCount: 4000,
      });

      expect(result.periodWordCount).toBe(0);
    });
  });
});
