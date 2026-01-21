// ABOUTME: Tests for DeleteProjectTaskUseCase
// ABOUTME: Verifies task deletion

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProjectTaskUseCase } from '../DeleteProjectTaskUseCase';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';

describe('DeleteProjectTaskUseCase', () => {
  let useCase: DeleteProjectTaskUseCase;
  let mockRepository: {
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      delete: vi.fn(),
    };

    useCase = new DeleteProjectTaskUseCase(
      mockRepository as unknown as ProjectTaskRepository
    );
  });

  it('deletes task successfully', async () => {
    mockRepository.delete.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        userId: 'user-1',
        taskId: 'task-1',
      })
    ).resolves.not.toThrow();

    expect(mockRepository.delete).toHaveBeenCalledWith('user-1', 'task-1');
  });

  it('propagates repository errors', async () => {
    mockRepository.delete.mockRejectedValue(new Error('Task not found'));

    await expect(
      useCase.execute({
        userId: 'user-1',
        taskId: 'task-1',
      })
    ).rejects.toThrow('Task not found');
  });
});
