// ABOUTME: Tests for RecordWordCountSnapshotUseCase
// ABOUTME: Verifies idempotent upsert of the project's total for the author-local day

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordWordCountSnapshotUseCase } from '../RecordWordCountSnapshotUseCase';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';

describe('RecordWordCountSnapshotUseCase', () => {
  let useCase: RecordWordCountSnapshotUseCase;
  let mockRepository: {
    upsertForDay: ReturnType<typeof vi.fn>;
    findByProjectId: ReturnType<typeof vi.fn>;
    findLatestBefore: ReturnType<typeof vi.fn>;
    deleteAllByOwner: ReturnType<typeof vi.fn>;
  };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      upsertForDay: vi.fn((_userId, snapshot) => Promise.resolve(snapshot)),
      findByProjectId: vi.fn().mockResolvedValue([]),
      findLatestBefore: vi.fn().mockResolvedValue(null),
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockIdGenerator = {
      generate: vi.fn(() => '507f1f77bcf86cd799439011'),
    };
    useCase = new RecordWordCountSnapshotUseCase(mockRepository, mockIdGenerator);
  });

  it('upserts a snapshot for the given local date and total', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      localDate: '2026-05-31',
      totalWords: 62400,
    });

    expect(mockRepository.upsertForDay).toHaveBeenCalledWith(
      'user-1',
      expect.any(WordCountSnapshot)
    );
    const [, snapshot] = mockRepository.upsertForDay.mock.calls[0];
    expect(snapshot.getOwnerId()).toBe('user-1');
    expect(snapshot.getProjectId()).toBe('project-1');
    expect(snapshot.getLocalDate()).toBe('2026-05-31');
    expect(snapshot.getTotalWords()).toBe(62400);
    expect(result.getTotalWords()).toBe(62400);
  });

  it('seeds a baseline before the week start when there is no prior history', async () => {
    mockRepository.findLatestBefore.mockResolvedValue(null);

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      localDate: '2026-05-31', // Sunday
      totalWords: 62400,
      previousTotalWords: 20000,
    });

    expect(mockRepository.upsertForDay).toHaveBeenCalledTimes(2);
    const snapshots = mockRepository.upsertForDay.mock.calls.map((c) => c[1]);

    const seed = snapshots.find((s) => s.getLocalDate() !== '2026-05-31')!;
    // Baseline is dated to the day before the current week's Monday (Sunday 2026-05-24)
    expect(seed.getLocalDate()).toBe('2026-05-24');
    expect(seed.getTotalWords()).toBe(20000);

    const today = snapshots.find((s) => s.getLocalDate() === '2026-05-31')!;
    expect(today.getTotalWords()).toBe(62400);
  });

  it('does not seed a baseline when prior history already exists', async () => {
    mockRepository.findLatestBefore.mockResolvedValue(
      WordCountSnapshot.reconstruct({
        id: '507f1f77bcf86cd799439012',
        projectId: 'project-1',
        ownerId: 'user-1',
        localDate: '2026-05-30',
        totalWords: 60000,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      localDate: '2026-05-31',
      totalWords: 62400,
      previousTotalWords: 20000,
    });

    expect(mockRepository.upsertForDay).toHaveBeenCalledTimes(1);
    expect(mockRepository.upsertForDay.mock.calls[0][1].getLocalDate()).toBe('2026-05-31');
  });

  it('does not seed when previousTotalWords is not provided', async () => {
    mockRepository.findLatestBefore.mockResolvedValue(null);

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      localDate: '2026-05-31',
      totalWords: 62400,
    });

    expect(mockRepository.upsertForDay).toHaveBeenCalledTimes(1);
  });

  it('propagates validation errors from the entity', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        localDate: '2026-05-31',
        totalWords: -5,
      })
    ).rejects.toThrow('Total words cannot be negative');
    expect(mockRepository.upsertForDay).not.toHaveBeenCalled();
  });
});
