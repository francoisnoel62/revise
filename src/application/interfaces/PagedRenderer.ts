// ABOUTME: Application seam for producing a complete paged-media HTML document.
// ABOUTME: Keeps preview and PDF export on the same rendered-document contract.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';

export interface TocEntry {
  readonly title: string;
  readonly chapterId: string;
}

export interface PagedRenderRequest {
  readonly bodyHtml: string;
  readonly profile: PublicationProfile;
  readonly assetBaseUrl: string;
  readonly frontMatter?: FrontMatterData;
  readonly toc?: TocEntry[];
  /** First Arabic page number for this render (default 1). Used for single-chapter previews. */
  readonly startPageNumber?: number;
  /** Opaque identifier echoed back in the paged-rendered postMessage for routing. */
  readonly sourceId?: string;
}

export interface PagedRenderer {
  render(request: PagedRenderRequest): string;
}
