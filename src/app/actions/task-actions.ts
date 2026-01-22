// ABOUTME: Server actions for project task CRUD operations
// ABOUTME: Provides API for creating, listing, updating, and deleting tasks

'use server';

import { getProjectTaskRepo, getIdGenerator, getAuthenticatedUserId } from './utils';
import { CreateProjectTaskUseCase } from '@/application/use-cases/CreateProjectTaskUseCase';
import { ListProjectTasksUseCase } from '@/application/use-cases/ListProjectTasksUseCase';
import { UpdateProjectTaskUseCase } from '@/application/use-cases/UpdateProjectTaskUseCase';
import { DeleteProjectTaskUseCase } from '@/application/use-cases/DeleteProjectTaskUseCase';
import {
  GetTaskSummaryUseCase,
  TaskSummary,
} from '@/application/use-cases/GetTaskSummaryUseCase';
import { TaskStatus } from '@/domain/value-objects/TaskStatus';
import { TaskPriority } from '@/domain/value-objects/TaskPriority';
import { TaskFilters, TaskSortOptions } from '@/domain/interfaces/ProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';

export interface SerializedProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  linkedChapterId: string | null;
  tags: string[];
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

function serializeTask(task: ProjectTask): SerializedProjectTask {
  return {
    id: task.getId(),
    projectId: task.getProjectId(),
    title: task.getTitle(),
    description: task.getDescription(),
    status: task.getStatus(),
    priority: task.getPriority(),
    dueDate: task.getDueDate()?.toISOString() ?? null,
    linkedChapterId: task.getLinkedChapterId(),
    tags: task.getTags(),
    isOverdue: task.isOverdue(),
    createdAt: task.getCreatedAt().toISOString(),
    updatedAt: task.getUpdatedAt().toISOString(),
  };
}

export async function createTaskAction(
  projectId: string,
  title: string,
  options?: {
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    linkedChapterId?: string;
    tags?: string[];
  }
): Promise<{ success: true; task: SerializedProjectTask } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new CreateProjectTaskUseCase(
      await getProjectTaskRepo(),
      await getIdGenerator()
    );

    const task = await useCase.execute({
      userId: authResult.userId,
      projectId,
      title,
      description: options?.description,
      status: options?.status,
      priority: options?.priority,
      dueDate: options?.dueDate ? new Date(options.dueDate) : undefined,
      linkedChapterId: options?.linkedChapterId,
      tags: options?.tags,
    });

    return { success: true, task: serializeTask(task) };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function listTasksAction(
  projectId: string,
  options?: {
    filters?: TaskFilters;
    sort?: TaskSortOptions;
    limit?: number;
    offset?: number;
  }
): Promise<
  { success: true; tasks: SerializedProjectTask[]; total: number } | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new ListProjectTasksUseCase(await getProjectTaskRepo());

    const { tasks, total } = await useCase.execute({
      userId: authResult.userId,
      projectId,
      filters: options?.filters,
      sort: options?.sort,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, tasks: tasks.map(serializeTask), total };
  } catch (error) {
    console.error('Error listing tasks:', error);
    return { success: false, error: 'Erreur lors du chargement des tâches' };
  }
}

export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    linkedChapterId?: string | null;
    tags?: string[];
  }
): Promise<{ success: true; task: SerializedProjectTask } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new UpdateProjectTaskUseCase(await getProjectTaskRepo());

    const task = await useCase.execute({
      userId: authResult.userId,
      taskId,
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      dueDate:
        updates.dueDate === null
          ? null
          : updates.dueDate
            ? new Date(updates.dueDate)
            : undefined,
      linkedChapterId: updates.linkedChapterId,
      tags: updates.tags,
    });

    return { success: true, task: serializeTask(task) };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function deleteTaskAction(
  taskId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new DeleteProjectTaskUseCase(await getProjectTaskRepo());

    await useCase.execute({
      userId: authResult.userId,
      taskId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}

export async function getTaskSummaryAction(
  projectId: string
): Promise<{ success: true; summary: TaskSummary } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new GetTaskSummaryUseCase(await getProjectTaskRepo());

    const summary = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, summary };
  } catch (error) {
    console.error('Error getting task summary:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}

export async function toggleTaskStatusAction(
  taskId: string
): Promise<{ success: true; task: SerializedProjectTask } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repo = await getProjectTaskRepo();
    const existing = await repo.findById(authResult.userId, taskId);

    if (!existing) {
      return { success: false, error: 'Tâche non trouvée' };
    }

    const updated = existing.cycleStatus();
    await repo.update(authResult.userId, updated);

    return { success: true, task: serializeTask(updated) };
  } catch (error) {
    console.error('Error toggling task status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

export async function getProjectTagsAction(
  projectId: string
): Promise<{ success: true; tags: string[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repo = await getProjectTaskRepo();
    const tags = await repo.getTagsByProject(authResult.userId, projectId);

    return { success: true, tags };
  } catch (error) {
    console.error('Error getting tags:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}
