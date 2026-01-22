// ABOUTME: Use case for deleting a project task
// ABOUTME: Validates ownership before deletion

import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';

export interface DeleteProjectTaskInput {
  userId: string;
  taskId: string;
}

export class DeleteProjectTaskUseCase {
  constructor(private readonly repository: ProjectTaskRepository) {}

  async execute(input: DeleteProjectTaskInput): Promise<void> {
    await this.repository.delete(input.userId, input.taskId);
  }
}
