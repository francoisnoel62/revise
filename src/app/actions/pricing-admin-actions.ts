// ABOUTME: Server actions for admin management of model pricing entries.
// ABOUTME: All actions require admin authentication via getAuthenticatedAdminId.

'use server';

import { getAuthenticatedAdminId } from './utils';
import { getModelPricingRepository, getPendingPriceChangeRepository } from '@/infrastructure/config/providers';
import { SyncModelPricingUseCase } from '@/application/use-cases/SyncModelPricingUseCase';
import { PruneObsoletePricingUseCase, PrunePricingReport } from '@/application/use-cases/PruneObsoletePricingUseCase';
import { OpenRouterPricingClient } from '@/infrastructure/pricing/OpenRouterPricingClient';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';
import { PricingSyncReport } from '@/domain/interfaces/EmailService';
import { PendingPriceChange } from '@/domain/interfaces/PendingPriceChangeRepository';

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
    const pendingRepo = await getPendingPriceChangeRepository();
    const useCase = new SyncModelPricingUseCase(
      new OpenRouterPricingClient(),
      repo,
      new ResendEmailService(),
      pendingRepo
    );
    const report = await useCase.execute();
    return { success: true, data: report };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listPendingPriceChangesAction(): Promise<ActionResult<PendingPriceChange[]>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getPendingPriceChangeRepository();
    const entries = await repo.findAll();
    entries.sort((a, b) => a.key.localeCompare(b.key));
    return { success: true, data: entries };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function approvePendingPriceChangeAction(id: string): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const pendingRepo = await getPendingPriceChangeRepository();
    const pending = (await pendingRepo.findAll()).find((p) => p.id === id);
    if (!pending) return { success: false, error: 'Changement introuvable' };

    const pricingRepo = await getModelPricingRepository();
    const updated = await pricingRepo.update(pending.modelPricingId, pending.current);
    if (!updated) return { success: false, error: 'Modèle introuvable, changement non appliqué' };

    await pendingRepo.delete(id);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function rejectPendingPriceChangeAction(id: string): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) return { success: false, error: 'Admin access required' };

  try {
    const repo = await getPendingPriceChangeRepository();
    await repo.delete(id);
    return { success: true, data: undefined };
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

