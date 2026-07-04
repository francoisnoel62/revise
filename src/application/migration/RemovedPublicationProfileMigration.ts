// ABOUTME: Resolves the replacement profile id for projects stored on a KDP trim removed from the catalogue.
// ABOUTME: Pure function used both by the one-shot DB migration script and its tests.

import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';

const REMOVED_PROFILE_IDS: ReadonlySet<string> = new Set([
  'kdp-5x8',
  'kdp-5_25x8',
  'kdp-5_5x8_5',
]);

const REPLACEMENT_PROFILE_ID: PublicationProfileId = 'kdp-6x9';

/**
 * Returns 'kdp-6x9' when the stored id is one of the 3 removed KDP trims,
 * or null when no migration is needed (already-valid or unrelated value).
 */
export function resolveMigratedProfileId(storedProfileId: string): PublicationProfileId | null {
  return REMOVED_PROFILE_IDS.has(storedProfileId) ? REPLACEMENT_PROFILE_ID : null;
}
