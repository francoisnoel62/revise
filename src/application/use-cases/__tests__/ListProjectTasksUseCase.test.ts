// ABOUTME: Tests for ListProjectTasksUseCase
// ABOUTME: Verifies task listing with filters and pagination

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListProjectTasksUseCase } from '../ListProjectTasksUseCase';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';

describe('ListProjectTasksUseCase', () => {
  let useCase: ListProjectTasksUseCase;
  let mockRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
    countByProjectId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn(),
      countByProjectId: vi.fn(),
    };

    useCase = new ListProjectTasksUseCase(
      mockRepository as unknown as ProjectTaskRepository
    );
  });

  it('returns tasks and total count', async () => {
    const mockTasks = [
      ProjectTask.create('task-1', 'project-1', 'user-1', 'Task 1'),
      ProjectTask.create('task-2', 'project-1', 'user-1', 'Task 2'),
    ];

    mockRepository.findByProjectId.mockResolvedValue(mockTasks);
    mockRepository.countByProjectId.mockResolvedValue(2);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.tasks).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('passes filters to repository', async () => {
    mockRepository.findByProjectId.mockResolvedValue([]);
    mockRepository.countByProjectId.mockResolvedValue(0);

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      filters: { status: 'todo' },
    });

    expect(mockRepository.findByProjectId).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      expect.objectContaining({
        filters: { status: 'todo' },
      })
    );
  });

  it('passes pagination options to repository', async () => {
    mockRepository.findByProjectId.mockResolvedValue([]);
    mockRepository.countByProjectId.mockResolvedValue(10);

    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      limit: 5,
      offset: 10,
    });

    expect(mockRepository.findByProjectId).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      expect.objectContaining({
        limit: 5,
        offset: 10,
      })
    );
  });
});
