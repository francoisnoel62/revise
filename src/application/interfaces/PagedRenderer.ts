// ABOUTME: Application seam for producing a complete paged-media HTML document.
// ABOUTME: Keeps preview and PDF export on the same rendered-document contract.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

export interface PagedRenderRequest {
  readonly bodyHtml: string;
  readonly profile: PublicationProfile;
  readonly assetBaseUrl: string;
}

export interface PagedRenderer {
  render(request: PagedRenderRequest): string;
}
