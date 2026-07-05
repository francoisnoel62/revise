// ABOUTME: Repository contract for the whole-book PDF preview cache (metrics + PDF blob).
// ABOUTME: Keyed by {projectId, profileId, ownerId}; the PDF lives in GridFS, metrics in a document.

import type { BookPreviewCacheEntry } from '../entities/BookPreviewCacheEntry';
import type { PublicationProfileId } from '../value-objects/PublicationProfile';

export interface BookPreviewCacheRepository {
  /** Upsert the metrics document and replace the cached PDF blob for the entry's key. */
  save(entry: BookPreviewCacheEntry, pdf: Buffer): Promise<void>;

  /** Metrics for a key, or null if nothing is cached. */
  loadMetrics(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
  ): Promise<BookPreviewCacheEntry | null>;

  /** Cached PDF bytes for a key, or null if nothing is cached. */
  loadPdf(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
  ): Promise<Buffer | null>;
}
