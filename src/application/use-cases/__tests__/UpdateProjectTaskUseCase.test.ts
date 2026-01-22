// ABOUTME: Tests for UpdateProjectTaskUseCase
// ABOUTME: Verifies partial task updates

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProjectTaskUseCase } from '../UpdateProjectTaskUseCase';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';

describe('UpdateProjectTaskUseCase', () => {
  let useCase: UpdateProjectTaskUseCase;
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      update: vi.fn((userId, task) => Promise.resolve(task)),
    };

    useCase = new UpdateProjectTaskUseCase(
      mockRepository as unknown as ProjectTaskRepository
    );
  });

  it('updates task title', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Old title');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      title: 'New title',
    });

    expect(result.getTitle()).toBe('New title');
  });

  it('updates task status', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      status: 'in_progress',
    });

    expect(result.getStatus()).toBe('in_progress');
  });

  it('updates task priority', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      priority: 'high',
    });

    expect(result.getPriority()).toBe('high');
  });

  it('updates task due date', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);
    const newDate = new Date('2025-06-15');

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      dueDate: newDate,
    });

    expect(result.getDueDate()).toEqual(newDate);
  });

  it('can clear due date with null', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
      dueDate: new Date('2025-06-15'),
    });
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      dueDate: null,
    });

    expect(result.getDueDate()).toBeNull();
  });

  it('updates task description', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      description: 'New description',
    });

    expect(result.getDescription()).toBe('New description');
  });

  it('updates linked chapter', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      linkedChapterId: 'chapter-5',
    });

    expect(result.getLinkedChapterId()).toBe('chapter-5');
  });

  it('updates tags', async () => {
    const existingTask = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
    mockRepository.findById.mockResolvedValue(existingTask);

    const result = await useCase.execute({
      userId: 'user-1',
      taskId: 'task-1',
      tags: ['new-tag', 'another-tag'],
    });

    expect(result.getTags()).toEqual(['new-tag', 'another-tag']);
  });

  it('throws error when task not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        taskId: 'task-1',
        title: 'New title',
      })
    ).rejects.toThrow('Task not found');
  });
});
