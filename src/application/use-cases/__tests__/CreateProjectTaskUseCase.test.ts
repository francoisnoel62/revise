// ABOUTME: Tests for CreateProjectTaskUseCase
// ABOUTME: Verifies task creation and validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectTaskUseCase } from '../CreateProjectTaskUseCase';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

describe('CreateProjectTaskUseCase', () => {
  let useCase: CreateProjectTaskUseCase;
  let mockRepository: {
    create: ReturnType<typeof vi.fn>;
  };
  let mockIdGenerator: IdGenerator;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn((userId, task) => Promise.resolve(task)),
    };

    mockIdGenerator = {
      generate: vi.fn(() => 'generated-id'),
    };

    useCase = new CreateProjectTaskUseCase(
      mockRepository as unknown as ProjectTaskRepository,
      mockIdGenerator
    );
  });

  it('creates a task with minimal input', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      title: 'Write chapter 1',
    });

    expect(result.getId()).toBe('generated-id');
    expect(result.getTitle()).toBe('Write chapter 1');
    expect(result.getStatus()).toBe('todo');
    expect(result.getPriority()).toBe('medium');
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('creates a task with all options', async () => {
    const dueDate = new Date('2025-12-31');

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      title: 'Research topic',
      description: 'Deep dive',
      status: 'in_progress',
      priority: 'high',
      dueDate,
      linkedChapterId: 'chapter-3',
      tags: ['research'],
    });

    expect(result.getDescription()).toBe('Deep dive');
    expect(result.getStatus()).toBe('in_progress');
    expect(result.getPriority()).toBe('high');
    expect(result.getDueDate()).toEqual(dueDate);
    expect(result.getLinkedChapterId()).toBe('chapter-3');
    expect(result.getTags()).toContain('research');
  });

  it('throws error for empty title', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        title: '',
      })
    ).rejects.toThrow();
  });
});
