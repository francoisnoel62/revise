// ABOUTME: Repository interface for persisting presentation overrides per chapter.
// ABOUTME: Overrides are scoped to the passerelle profile and keyed by chapterId.

import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

export interface PresentationOverrideRepository {
  save(chapterId: string, overrides: PresentationOverrideLayer): Promise<void>;
  load(chapterId: string): Promise<PresentationOverrideLayer | null>;
  delete(chapterId: string): Promise<void>;
}
