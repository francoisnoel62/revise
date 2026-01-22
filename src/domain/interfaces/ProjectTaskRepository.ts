// ABOUTME: Repository interface for ProjectTask persistence
// ABOUTME: Defines contract for storing and querying project tasks

import { ProjectTask } from '../entities/ProjectTask';
import { TaskStatus } from '../value-objects/TaskStatus';
import { TaskPriority } from '../value-objects/TaskPriority';

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  linkedChapterId?: string;
  tags?: string[];
  isOverdue?: boolean;
}

export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

export interface ProjectTaskRepository {
  create(userId: string, task: ProjectTask): Promise<ProjectTask>;
  findById(userId: string, taskId: string): Promise<ProjectTask | null>;
  findByProjectId(
    userId: string,
    projectId: string,
    options?: {
      filters?: TaskFilters;
      sort?: TaskSortOptions;
      limit?: number;
      offset?: number;
    }
  ): Promise<ProjectTask[]>;
  countByProjectId(
    userId: string,
    projectId: string,
    filters?: TaskFilters
  ): Promise<number>;
  update(userId: string, task: ProjectTask): Promise<ProjectTask>;
  delete(userId: string, taskId: string): Promise<void>;
  deleteAllByProject(userId: string, projectId: string): Promise<void>;
  deleteAllByOwner(userId: string): Promise<void>;
  getTagsByProject(userId: string, projectId: string): Promise<string[]>;
}
