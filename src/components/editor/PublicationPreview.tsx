// ABOUTME: Renders the active chapter through the shared paged-media renderer.
// ABOUTME: Regenerates preview geometry and typography whenever the profile changes.

'use client';

import type { JSONContent } from '@tiptap/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { switchPublicationProfile } from '@/application/rendering/PublicationProfileSwitch';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';
import {
  PublicationProfile,
  type PublicationProfileId,
} from '@/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';

const renderer = new PagedJsRenderer();
const converter = new TipTapToBookHtml();

interface PagedRenderedMessage {
  readonly type: 'paged-rendered';
  readonly pageCount: number;
  readonly sourceId: string | null;
  readonly paginationMs: number;
}

interface PublicationPreviewProps {
  readonly content: ContentNode;
  readonly profileId: PublicationProfileId;
  readonly overrides: PresentationOverrideLayer;
  /** First Arabic page number to display (default 1). */
  readonly startPageNumber?: number;
  /** Called with the total page count whenever the iframe finishes rendering. */
  readonly onPageCountChange?: (count: number) => void;
  readonly levelStyles?: LevelStyleSetProperties;
  /** Editor scroll progress (0..1) used to drive the preview's own scroll position. */
  readonly scrollProgress?: number;
}

export function PublicationPreview({
  content,
  profileId,
  overrides,
  startPageNumber,
  onPageCountChange,
  levelStyles,
  scrollProgress,
}: PublicationPreviewProps) {
  const [renderedContent, setRenderedContent] = useState(content);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastPostedProgressRef = useRef(0);
  const scrollProgressRef = useRef(scrollProgress ?? 0);

  useEffect(() => {
    const timer = setTimeout(() => setRenderedContent(content), 300);
    lastPostedProgressRef.current = 0;
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (scrollProgress === undefined) return;
    scrollProgressRef.current = scrollProgress;
    if (Math.abs(scrollProgress - lastPostedProgressRef.current) <= 0.002) return;
    lastPostedProgressRef.current = scrollProgress;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'sync-scroll', progress: scrollProgress },
      '*'
    );
  }, [scrollProgress]);

  const handleMessage = useCallback(
    (event: MessageEvent<PagedRenderedMessage>) => {
      if (event.data?.type !== 'paged-rendered') return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      onPageCountChange?.(event.data.pageCount);
      // Re-generating srcDoc reloads the iframe and re-paginates from the top, dropping
      // the preview's scroll position. Re-apply the editor's current progress so the
      // preview keeps following the text without the author having to scroll. The iframe
      // already reloads to the top, so there is nothing to restore at progress 0.
      const progress = scrollProgressRef.current;
      if (progress <= 0) return;
      lastPostedProgressRef.current = progress;
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'sync-scroll', progress },
        '*'
      );
    },
    [onPageCountChange],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const documentHtml = useMemo(() => {
    const displayed = switchPublicationProfile(renderedContent, profileId, overrides).content;
    return renderer.render({
      bodyHtml: converter.convert(displayed as JSONContent),
      profile: PublicationProfile.fromId(profileId),
      assetBaseUrl:
        typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
      startPageNumber,
      levelStyles,
    });
  }, [levelStyles, overrides, profileId, renderedContent, startPageNumber]);

  const label = profileId === 'passerelle' ? 'Passerelle' : 'KDP 6×9';

  return (
    <iframe
      ref={iframeRef}
      className="block h-[calc(100vh-12rem)] min-h-160 w-full border-0 bg-slate-200"
      data-profile-id={profileId}
      data-testid="publication-preview"
      sandbox="allow-same-origin allow-scripts"
      srcDoc={documentHtml}
      title={`Aperçu paginé ${label}`}
    />
  );
}
