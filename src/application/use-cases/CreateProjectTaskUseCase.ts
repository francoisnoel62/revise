// ABOUTME: Use case for creating a new project task
// ABOUTME: Validates input and delegates to repository

import { ProjectTask } from '@/domain/entities/ProjectTask';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { TaskStatus } from '@/domain/value-objects/TaskStatus';
import { TaskPriority } from '@/domain/value-objects/TaskPriority';

export interface CreateProjectTaskInput {
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  linkedChapterId?: string;
  tags?: string[];
}

export class CreateProjectTaskUseCase {
  constructor(
    private readonly repository: ProjectTaskRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateProjectTaskInput): Promise<ProjectTask> {
    const task = ProjectTask.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.title,
      {
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        linkedChapterId: input.linkedChapterId,
        tags: input.tags,
      }
    );

    return this.repository.create(input.userId, task);
  }
}
