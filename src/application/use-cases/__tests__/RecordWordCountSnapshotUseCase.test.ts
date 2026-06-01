// ABOUTME: Tests for RecordWordCountSnapshotUseCase
// ABOUTME: Verifies idempotent upsert of the project's total for the author-local day

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordWordCountSnapshotUseCase } from '../RecordWordCountSnapshotUseCase';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';

describe('RecordWordCountSnapshotUseCase', () => {
  let useCase: RecordWordCountSnapshotUseCase;
  let mockRepository: { upsertForDay: ReturnType<typeof vi.fn> };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      upsertForDay: vi.fn((_userId, snapshot) => Promise.resolve(snapshot)),
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
