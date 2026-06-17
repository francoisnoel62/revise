// ABOUTME: Server actions for admin management of model pricing entries.
// ABOUTME: All actions require admin authentication via getAuthenticatedAdminId.

'use server';

import { getAuthenticatedAdminId } from './utils';
import { getModelPricingRepository } from '@/infrastructure/config/providers';
import { SyncModelPricingUseCase } from '@/application/use-cases/SyncModelPricingUseCase';
import { PruneObsoletePricingUseCase, PrunePricingReport } from '@/application/use-cases/PruneObsoletePricingUseCase';
import { OpenRouterPricingClient } from '@/infrastructure/pricing/OpenRouterPricingClient';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';
import { PricingSyncReport } from '@/domain/interfaces/EmailService';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listModelPricingAction(): Promise<ActionResult<ModelPricingEntry[]>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getModelPricingRepository();
    const entries = await repo.findAll();
    entries.sort((a, b) =>
      a.provider.localeCompare(b.provider) || a.prefix.localeCompare(b.prefix)
    );
    return { success: true, data: entries };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateModelPricingAction(
  id: string,
  data: { inputPerM?: number; outputPerM?: number; cachedInputPerM?: number; cachedInInput?: boolean }
): Promise<ActionResult<ModelPricingEntry>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getModelPricingRepository();
    const updated = await repo.update(id, data);
    if (!updated) return { success: false, error: 'Entry not found' };
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteModelPricingAction(id: string): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getModelPricingRepository();
    await repo.delete(id);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function triggerPricingSyncAction(): Promise<ActionResult<PricingSyncReport>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getModelPricingRepository();
    const useCase = new SyncModelPricingUseCase(
      new OpenRouterPricingClient(),
      repo,
      new ResendEmailService()
    );
    const report = await useCase.execute();
    return { success: true, data: report };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function prunePricingAction(): Promise<ActionResult<PrunePricingReport>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getModelPricingRepository();
    const useCase = new PruneObsoletePricingUseCase(new OpenRouterPricingClient(), repo);
    const report = await useCase.execute();
    return { success: true, data: report };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

