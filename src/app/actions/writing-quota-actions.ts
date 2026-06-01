// ABOUTME: Server actions for recurring writing quota CRUD operations
// ABOUTME: Provides API for creating, listing, updating, and deleting daily/weekly quotas

'use server';

import { getWritingQuotaRepo, getIdGenerator, getAuthenticatedUserId } from './utils';
import { CreateWritingQuotaUseCase } from '@/application/use-cases/CreateWritingQuotaUseCase';
import { ListWritingQuotasUseCase } from '@/application/use-cases/ListWritingQuotasUseCase';
import { UpdateWritingQuotaUseCase } from '@/application/use-cases/UpdateWritingQuotaUseCase';
import { DeleteWritingQuotaUseCase } from '@/application/use-cases/DeleteWritingQuotaUseCase';
import { QuotaPeriod, WritingQuota } from '@/domain/entities/WritingQuota';

export interface SerializedWritingQuota {
  id: string;
  projectId: string;
  period: QuotaPeriod;
  targetWords: number;
  createdAt: string;
  updatedAt: string;
}

function serializeQuota(quota: WritingQuota): SerializedWritingQuota {
  return {
    id: quota.getId(),
    projectId: quota.getProjectId(),
    period: quota.getPeriod(),
    targetWords: quota.getTargetWords(),
    createdAt: quota.getCreatedAt().toISOString(),
    updatedAt: quota.getUpdatedAt().toISOString(),
  };
}

export async function createWritingQuotaAction(
  projectId: string,
  period: QuotaPeriod,
  targetWords: number
): Promise<{ success: true; quota: SerializedWritingQuota } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new CreateWritingQuotaUseCase(
      await getWritingQuotaRepo(),
      await getIdGenerator()
    );

    const quota = await useCase.execute({
      userId: authResult.userId,
      projectId,
      period,
      targetWords,
    });

    return { success: true, quota: serializeQuota(quota) };
  } catch (error) {
    console.error('Error creating writing quota:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function listWritingQuotasAction(
  projectId: string
): Promise<{ success: true; quotas: SerializedWritingQuota[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new ListWritingQuotasUseCase(await getWritingQuotaRepo());

    const quotas = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, quotas: quotas.map(serializeQuota) };
  } catch (error) {
    console.error('Error listing writing quotas:', error);
    return { success: false, error: 'Erreur lors du chargement des quotas' };
  }
}

export async function updateWritingQuotaAction(
  quotaId: string,
  updates: { targetWords?: number; period?: QuotaPeriod }
): Promise<{ success: true; quota: SerializedWritingQuota } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new UpdateWritingQuotaUseCase(await getWritingQuotaRepo());

    const quota = await useCase.execute({
      userId: authResult.userId,
      quotaId,
      targetWords: updates.targetWords,
      period: updates.period,
    });

    return { success: true, quota: serializeQuota(quota) };
  } catch (error) {
    console.error('Error updating writing quota:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function deleteWritingQuotaAction(
  quotaId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new DeleteWritingQuotaUseCase(await getWritingQuotaRepo());

    await useCase.execute({
      userId: authResult.userId,
      quotaId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting writing quota:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}
