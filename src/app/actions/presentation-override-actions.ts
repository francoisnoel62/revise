// ABOUTME: Server Actions for saving and loading presentation overrides (passerelle profile).
// ABOUTME: Overrides are stored separately from chapter content — never destructive.

'use server';

import { getAuthenticatedUserId, getPresentationOverrideRepo, withErrorHandling, ActionResult } from './utils';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

/**
 * Persist the presentation override layer for a chapter.
 * Passing an empty array clears the overrides for that chapter.
 */
export async function savePresentationOverridesAction(
  chapterId: string,
  overrides: PresentationOverrideLayer
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getPresentationOverrideRepo();
    if (overrides.length === 0) {
      await repo.delete(chapterId);
    } else {
      await repo.save(chapterId, overrides);
    }
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
    return await repo.load(chapterId);
  });
}
