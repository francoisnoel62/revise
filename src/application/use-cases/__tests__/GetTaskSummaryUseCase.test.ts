// ABOUTME: Tests for GetTaskSummaryUseCase
// ABOUTME: Verifies task statistics summary retrieval

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetTaskSummaryUseCase } from '../GetTaskSummaryUseCase';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';

describe('GetTaskSummaryUseCase', () => {
  let useCase: GetTaskSummaryUseCase;
  let mockRepository: {
    countByProjectId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      countByProjectId: vi.fn(),
    };

    useCase = new GetTaskSummaryUseCase(
      mockRepository as unknown as ProjectTaskRepository
    );
  });

  it('returns task summary with all counts', async () => {
    mockRepository.countByProjectId
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(5) // todo
      .mockResolvedValueOnce(3) // in_progress
      .mockResolvedValueOnce(2) // done
      .mockResolvedValueOnce(1); // overdue

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result).toEqual({
      total: 10,
      todo: 5,
      inProgress: 3,
      done: 2,
      overdue: 1,
    });
  });

  it('calls countByProjectId with correct filters', async () => {
    mockRepository.countByProjectId.mockResolvedValue(0);

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    // Total count
    expect(mockRepository.countByProjectId).toHaveBeenCalledWith('user-1', 'project-1');

    // Status filters
    expect(mockRepository.countByProjectId).toHaveBeenCalledWith('user-1', 'project-1', {
      status: 'todo',
    });
    expect(mockRepository.countByProjectId).toHaveBeenCalledWith('user-1', 'project-1', {
      status: 'in_progress',
    });
    expect(mockRepository.countByProjectId).toHaveBeenCalledWith('user-1', 'project-1', {
      status: 'done',
    });

    // Overdue filter
    expect(mockRepository.countByProjectId).toHaveBeenCalledWith('user-1', 'project-1', {
      isOverdue: true,
    });
  });
});
