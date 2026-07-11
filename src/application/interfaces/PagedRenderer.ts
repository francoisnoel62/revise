// ABOUTME: Application seam for producing a complete paged-media HTML document.
// ABOUTME: Keeps preview and PDF export on the same rendered-document contract.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { BackMatterData, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocStyle } from '@/domain/value-objects/TocPreferences';

/** A sous-titre entry nested under its chapter's TOC entry. */
export interface TocSubEntry {
  readonly title: string;
  readonly anchorId: string;
}

export interface TocEntry {
  readonly title: string;
  readonly chapterId: string;
  readonly subEntries?: readonly TocSubEntry[];
}

export interface PagedRenderRequest {
  readonly bodyHtml: string;
  readonly profile: PublicationProfile;
  readonly assetBaseUrl: string;
  readonly frontMatter?: FrontMatterData;
  /** Back matter (custom annexes then legal notice), rendered after the body. */
  readonly backMatter?: BackMatterData;
  readonly toc?: TocEntry[];
  /** TOC design; defaults to 'classique' (the historical rendering). */
  readonly tocStyle?: TocStyle;
  /** First Arabic page number for this render (default 1). Used for single-chapter previews. */
  readonly startPageNumber?: number;
  /** Opaque identifier echoed back in the paged-rendered postMessage for routing. */
  readonly sourceId?: string;
  /** Typography overrides for the rendered PDF profile. */
  readonly levelStyles?: LevelStyleSetProperties;
}

export interface PagedRenderer {
  render(request: PagedRenderRequest): string;
}
