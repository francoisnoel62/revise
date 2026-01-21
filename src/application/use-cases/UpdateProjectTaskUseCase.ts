// ABOUTME: Use case for updating a project task
// ABOUTME: Supports partial updates to any task field

import { ProjectTask } from '@/domain/entities/ProjectTask';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { TaskStatus } from '@/domain/value-objects/TaskStatus';
import { TaskPriority } from '@/domain/value-objects/TaskPriority';

export interface UpdateProjectTaskInput {
  userId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  linkedChapterId?: string | null;
  tags?: string[];
}

export class UpdateProjectTaskUseCase {
  constructor(private readonly repository: ProjectTaskRepository) {}

  async execute(input: UpdateProjectTaskInput): Promise<ProjectTask> {
    const existing = await this.repository.findById(input.userId, input.taskId);

    if (!existing) {
      throw new Error('Task not found');
    }

    let updated = existing;

    if (input.title !== undefined) {
      updated = updated.updateTitle(input.title);
    }

    if (input.description !== undefined) {
      updated = updated.updateDescription(input.description);
    }

    if (input.status !== undefined) {
      updated = updated.updateStatus(input.status);
    }

    if (input.priority !== undefined) {
      updated = updated.updatePriority(input.priority);
    }

    if (input.dueDate !== undefined) {
      updated = updated.updateDueDate(input.dueDate);
    }

    if (input.linkedChapterId !== undefined) {
      updated = updated.linkToChapter(input.linkedChapterId);
    }

    if (input.tags !== undefined) {
      updated = updated.updateTags(input.tags);
    }

    return this.repository.update(input.userId, updated);
  }
}
