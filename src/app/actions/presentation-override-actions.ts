// ABOUTME: Server Actions for saving and loading presentation overrides (passerelle profile).
// ABOUTME: Overrides are stored separately from chapter content — never destructive.

'use server';

import { getAuthenticatedUserId, getPresentationOverrideRepo, withErrorHandling, ActionResult } from './utils';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

/**
 * Persist the presentation override layer for a chapter.
 */
export async function savePresentationOverridesAction(
  chapterId: string,
  overrides: PresentationOverrideLayer
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getPresentationOverrideRepo();
    await repo.save(chapterId, auth.userId, overrides);
  });
}

/**
 * Load the presentation override layer for a chapter.
 * Returns null when no overrides exist for that chapter.
 */
export async function loadPresentationOverridesAction(
  chapterId: string
): Promise<ActionResult<PresentationOverrideLayer | null>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getPresentationOverrideRepo();
    return await repo.load(chapterId, auth.userId);
  });
}

/**
 * Remove all presentation overrides for a chapter (retrait).
 */
export async function deletePresentationOverridesAction(
  chapterId: string
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getPresentationOverrideRepo();
    await repo.delete(chapterId, auth.userId);
  });
}
