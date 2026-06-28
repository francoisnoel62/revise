// ABOUTME: Renders the active chapter through the shared paged-media renderer.
// ABOUTME: Regenerates preview geometry and typography whenever the profile changes.

'use client';

import type { JSONContent } from '@tiptap/core';
import { useEffect, useMemo, useState } from 'react';
import { switchPublicationProfile } from '@/application/rendering/PublicationProfileSwitch';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';
import {
  PublicationProfile,
  type PublicationProfileId,
} from '@/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

const renderer = new PagedJsRenderer();
const converter = new TipTapToBookHtml();

interface PublicationPreviewProps {
  readonly content: ContentNode;
  readonly profileId: PublicationProfileId;
  readonly overrides: PresentationOverrideLayer;
}

export function PublicationPreview({
  content,
  profileId,
  overrides,
}: PublicationPreviewProps) {
  const [renderedContent, setRenderedContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => setRenderedContent(content), 300);
    return () => clearTimeout(timer);
  }, [content]);

  const documentHtml = useMemo(() => {
    const displayed = switchPublicationProfile(renderedContent, profileId, overrides).content;
    return renderer.render({
      bodyHtml: converter.convert(displayed as JSONContent),
      profile: PublicationProfile.fromId(profileId),
      assetBaseUrl:
        typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
    });
  }, [overrides, profileId, renderedContent]);

  const label = profileId === 'passerelle' ? 'Passerelle' : 'KDP 6×9';

  return (
    <iframe
      className="block h-[calc(100vh-12rem)] min-h-160 w-full border-0 bg-slate-200"
      data-profile-id={profileId}
      data-testid="publication-preview"
      sandbox="allow-same-origin allow-scripts"
      srcDoc={documentHtml}
      title={`Aperçu paginé ${label}`}
    />
  );
}
