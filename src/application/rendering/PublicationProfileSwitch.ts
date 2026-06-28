// ABOUTME: Switches rendered manuscript content between publication profiles without data loss.
// ABOUTME: Keeps presentation overrides dormant in print-ready profiles and restores them in passerelle.

import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import {
  applyOverrides,
  extractOverrides,
  stripToSemantic,
} from './PresentationOverrideService';

export interface PublicationProfileSwitchResult {
  readonly content: ContentNode;
  readonly overrides: PresentationOverrideLayer;
}

export function switchPublicationProfile(
  content: ContentNode,
  targetProfileId: PublicationProfileId,
  dormantOverrides: PresentationOverrideLayer
): PublicationProfileSwitchResult {
  const extractedOverrides = extractOverrides(content);
  const overrides = extractedOverrides.length > 0 ? extractedOverrides : dormantOverrides;
  const semanticContent = stripToSemantic(content);

  return {
    content:
      targetProfileId === 'passerelle'
        ? applyOverrides(semanticContent, overrides)
        : semanticContent,
    overrides,
  };
}
