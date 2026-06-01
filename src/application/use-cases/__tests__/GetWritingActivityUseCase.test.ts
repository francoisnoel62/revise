// ABOUTME: Tests for GetWritingActivityUseCase
// ABOUTME: Verifies per-day written deltas, including null for the first point and raw negatives

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetWritingActivityUseCase } from '../GetWritingActivityUseCase';
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

describe('GetWritingActivityUseCase', () => {
  let useCase: GetWritingActivityUseCase;
  let mockRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
    findLatestBefore: ReturnType<typeof vi.fn>;
    upsertForDay: ReturnType<typeof vi.fn>;
    deleteAllByOwner: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn().mockResolvedValue([]),
      findLatestBefore: vi.fn().mockResolvedValue(null),
      upsertForDay: vi.fn((_userId, snapshot) => Promise.resolve(snapshot)),
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new GetWritingActivityUseCase(mockRepository as never);
  });

  it('reports the first point with no predecessor as written = null', async () => {
    mockRepository.findByProjectId.mockResolvedValue([snap('2026-05-28', 60000)]);

    const result = await useCase.execute({ userId: 'user-1', projectId: 'project-1' });

    expect(result).toEqual([{ localDate: '2026-05-28', total: 60000, written: null }]);
  });

  it('computes per-day deltas and preserves negative deltas (cuts)', async () => {
    mockRepository.findByProjectId.mockResolvedValue([
      snap('2026-05-28', 60000),
      snap('2026-05-29', 61200),
      snap('2026-05-30', 60900),
      snap('2026-05-31', 62400),
    ]);

    const result = await useCase.execute({ userId: 'user-1', projectId: 'project-1' });

    expect(result).toEqual([
      { localDate: '2026-05-28', total: 60000, written: null },
      { localDate: '2026-05-29', total: 61200, written: 1200 },
      { localDate: '2026-05-30', total: 60900, written: -300 },
      { localDate: '2026-05-31', total: 62400, written: 1500 },
    ]);
  });

  it('uses the snapshot before the range as the baseline for the first delta', async () => {
    mockRepository.findLatestBefore.mockResolvedValue(snap('2026-05-27', 59000));
    mockRepository.findByProjectId.mockResolvedValue([
      snap('2026-05-28', 60000),
      snap('2026-05-29', 61200),
    ]);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      range: { fromDate: '2026-05-28', toDate: '2026-05-29' },
    });

    expect(mockRepository.findLatestBefore).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      '2026-05-28'
    );
    expect(result).toEqual([
      { localDate: '2026-05-28', total: 60000, written: 1000 },
      { localDate: '2026-05-29', total: 61200, written: 1200 },
    ]);
  });

  it('does not query a baseline when no range start is given', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'project-1' });
    expect(mockRepository.findLatestBefore).not.toHaveBeenCalled();
  });
});
