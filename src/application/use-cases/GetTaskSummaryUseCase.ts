// ABOUTME: Use case for getting task statistics summary
// ABOUTME: Returns counts by status for dashboard display

import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';

export interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface GetTaskSummaryInput {
  userId: string;
  projectId: string;
}

export class GetTaskSummaryUseCase {
  constructor(private readonly repository: ProjectTaskRepository) {}

  async execute(input: GetTaskSummaryInput): Promise<TaskSummary> {
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      this.repository.countByProjectId(input.userId, input.projectId),
      this.repository.countByProjectId(input.userId, input.projectId, { status: 'todo' }),
      this.repository.countByProjectId(input.userId, input.projectId, {
        status: 'in_progress',
      }),
      this.repository.countByProjectId(input.userId, input.projectId, { status: 'done' }),
      this.repository.countByProjectId(input.userId, input.projectId, { isOverdue: true }),
    ]);

    return { total, todo, inProgress, done, overdue };
  }
}
