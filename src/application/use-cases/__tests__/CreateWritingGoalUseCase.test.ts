// ABOUTME: Tests for CreateWritingGoalUseCase
// ABOUTME: Verifies goal creation and validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateWritingGoalUseCase } from '../CreateWritingGoalUseCase';

describe('CreateWritingGoalUseCase', () => {
  let useCase: CreateWritingGoalUseCase;
  let mockRepository: { create: ReturnType<typeof vi.fn> };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      create: vi.fn((userId, goal) => Promise.resolve(goal)),
    };

    mockIdGenerator = {
      generate: vi.fn(() => 'generated-id'),
    };

    useCase = new CreateWritingGoalUseCase(mockRepository, mockIdGenerator);
  });

  it('creates a goal with valid input', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      targetWords: 50000,
    });

    expect(result.getId()).toBe('generated-id');
    expect(result.getTargetWords()).toBe(50000);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('creates a goal with deadline', async () => {
    const deadline = new Date('2025-12-31');

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      targetWords: 5000,
      deadline,
    });

    expect(result.getDeadline()).toEqual(deadline);
  });

  it('throws error for invalid target', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        targetWords: 0,
      })
    ).rejects.toThrow();
  });
});
