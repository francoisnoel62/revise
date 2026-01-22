// ABOUTME: Server actions for writing goal CRUD operations
// ABOUTME: Provides API for creating, listing, updating, and deleting goals

'use server';

import { getWritingGoalRepo, getIdGenerator, getAuthenticatedUserId } from './utils';
import { CreateWritingGoalUseCase } from '@/application/use-cases/CreateWritingGoalUseCase';
import { ListWritingGoalsUseCase } from '@/application/use-cases/ListWritingGoalsUseCase';
import { UpdateWritingGoalUseCase } from '@/application/use-cases/UpdateWritingGoalUseCase';
import { DeleteWritingGoalUseCase } from '@/application/use-cases/DeleteWritingGoalUseCase';
import { GetActiveWritingGoalUseCase } from '@/application/use-cases/GetActiveWritingGoalUseCase';
import { GoalType, WritingGoal } from '@/domain/entities/WritingGoal';

export interface SerializedWritingGoal {
  id: string;
  projectId: string;
  type: GoalType;
  targetWords: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

function serializeGoal(goal: WritingGoal): SerializedWritingGoal {
  return {
    id: goal.getId(),
    projectId: goal.getProjectId(),
    type: goal.getType(),
    targetWords: goal.getTargetWords(),
    deadline: goal.getDeadline()?.toISOString() ?? null,
    createdAt: goal.getCreatedAt().toISOString(),
    updatedAt: goal.getUpdatedAt().toISOString(),
  };
}

export async function createWritingGoalAction(
  projectId: string,
  type: GoalType,
  targetWords: number,
  deadline?: string
): Promise<{ success: true; goal: SerializedWritingGoal } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new CreateWritingGoalUseCase(
      await getWritingGoalRepo(),
      await getIdGenerator()
    );

    const goal = await useCase.execute({
      userId: authResult.userId,
      projectId,
      type,
      targetWords,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    return { success: true, goal: serializeGoal(goal) };
  } catch (error) {
    console.error('Error creating writing goal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function listWritingGoalsAction(
  projectId: string
): Promise<{ success: true; goals: SerializedWritingGoal[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new ListWritingGoalsUseCase(await getWritingGoalRepo());

    const goals = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, goals: goals.map(serializeGoal) };
  } catch (error) {
    console.error('Error listing writing goals:', error);
    return { success: false, error: 'Erreur lors du chargement des objectifs' };
  }
}

export async function updateWritingGoalAction(
  goalId: string,
  updates: {
    targetWords?: number;
    deadline?: string | null;
    type?: GoalType;
  }
): Promise<{ success: true; goal: SerializedWritingGoal } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new UpdateWritingGoalUseCase(await getWritingGoalRepo());

    const goal = await useCase.execute({
      userId: authResult.userId,
      goalId,
      targetWords: updates.targetWords,
      deadline: updates.deadline === null ? null : updates.deadline ? new Date(updates.deadline) : undefined,
      type: updates.type,
    });

    return { success: true, goal: serializeGoal(goal) };
  } catch (error) {
    console.error('Error updating writing goal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function deleteWritingGoalAction(
  goalId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new DeleteWritingGoalUseCase(await getWritingGoalRepo());

    await useCase.execute({
      userId: authResult.userId,
      goalId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting writing goal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}

export async function getActiveWritingGoalAction(
  projectId: string
): Promise<{ success: true; goal: SerializedWritingGoal | null } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new GetActiveWritingGoalUseCase(await getWritingGoalRepo());

    const goal = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, goal: goal ? serializeGoal(goal) : null };
  } catch (error) {
    console.error('Error getting active goal:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}
