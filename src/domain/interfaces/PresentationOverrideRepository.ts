// ABOUTME: Repository interface for persisting presentation overrides per chapter.
// ABOUTME: Overrides are scoped to the passerelle profile and keyed by chapterId + ownerId.

import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

export interface PresentationOverrideRepository {
  save(chapterId: string, ownerId: string, overrides: PresentationOverrideLayer): Promise<void>;
  load(chapterId: string, ownerId: string): Promise<PresentationOverrideLayer | null>;
  delete(chapterId: string, ownerId: string): Promise<void>;
}
