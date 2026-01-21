// ABOUTME: Use case for listing project tasks with filtering and sorting
// ABOUTME: Returns paginated tasks based on criteria

import { ProjectTask } from '@/domain/entities/ProjectTask';
import {
  ProjectTaskRepository,
  TaskFilters,
  TaskSortOptions,
} from '@/domain/interfaces/ProjectTaskRepository';

export interface ListProjectTasksInput {
  userId: string;
  projectId: string;
  filters?: TaskFilters;
  sort?: TaskSortOptions;
  limit?: number;
  offset?: number;
}

export interface ListProjectTasksOutput {
  tasks: ProjectTask[];
  total: number;
}

export class ListProjectTasksUseCase {
  constructor(private readonly repository: ProjectTaskRepository) {}

  async execute(input: ListProjectTasksInput): Promise<ListProjectTasksOutput> {
    const [tasks, total] = await Promise.all([
      this.repository.findByProjectId(input.userId, input.projectId, {
        filters: input.filters,
        sort: input.sort,
        limit: input.limit,
        offset: input.offset,
      }),
      this.repository.countByProjectId(input.userId, input.projectId, input.filters),
    ]);

    return { tasks, total };
  }
}
