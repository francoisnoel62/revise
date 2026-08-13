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
import type { PagedRenderer } from '@/application/interfaces/PagedRenderer';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import { tagWordAnchors } from '@/application/services/wordAnchors';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';

const WORDS_PER_SCROLL_SEGMENT = 1000;

interface PagedRenderedMessage {
  readonly type: 'paged-rendered';
  readonly pageCount: number;
  readonly sourceId: string | null;
  readonly paginationMs: number;
}

/** A position within the editor's scroll range: which 1000-word segment, and how far into it. */
interface ScrollPosition {
  readonly segmentIndex: number;
  readonly localRatio: number;
}

const ZERO_SCROLL_POSITION: ScrollPosition = { segmentIndex: 0, localRatio: 0 };

interface PublicationPreviewProps {
  readonly content: ContentNode;
  /** Application seams assembled by the editor entry point. */
  readonly renderer: PagedRenderer;
  readonly converter: TipTapToHtmlConverter;
  readonly profileId: PublicationProfileId;
  readonly overrides: PresentationOverrideLayer;
  /** First Arabic page number to display (default 1). */
  readonly startPageNumber?: number;
  /** Called with the total page count whenever the iframe finishes rendering. */
  readonly onPageCountChange?: (count: number) => void;
  readonly levelStyles?: LevelStyleSetProperties;
  /** Whether the author's blank lines occupy a line; resolved per project by honorsBlankLines. */
  readonly honorBlankLines?: boolean;
  /** Editor scroll position (word-anchor segment + local ratio) driving the preview's scroll. */
  readonly scrollPosition?: ScrollPosition;
}

export function PublicationPreview({
  content,
  renderer,
  converter,
  profileId,
  overrides,
  startPageNumber,
  onPageCountChange,
  levelStyles,
  honorBlankLines,
  scrollPosition,
}: PublicationPreviewProps) {
  const [renderedContent, setRenderedContent] = useState(content);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastPostedPositionRef = useRef<ScrollPosition>(ZERO_SCROLL_POSITION);
  const scrollPositionRef = useRef<ScrollPosition>(scrollPosition ?? ZERO_SCROLL_POSITION);

  useEffect(() => {
    const timer = setTimeout(() => setRenderedContent(content), 300);
    lastPostedPositionRef.current = ZERO_SCROLL_POSITION;
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (scrollPosition === undefined) return;
    scrollPositionRef.current = scrollPosition;
    const last = lastPostedPositionRef.current;
    if (
      scrollPosition.segmentIndex === last.segmentIndex &&
      Math.abs(scrollPosition.localRatio - last.localRatio) <= 0.002
    ) {
      return;
    }
    lastPostedPositionRef.current = scrollPosition;
    iframeRef.current?.contentWindow?.postMessage({ type: 'sync-scroll', ...scrollPosition }, '*');
  }, [scrollPosition]);

  const handleMessage = useCallback(
    (event: MessageEvent<PagedRenderedMessage>) => {
      if (event.data?.type !== 'paged-rendered') return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      onPageCountChange?.(event.data.pageCount);
      // Re-generating srcDoc reloads the iframe and re-paginates from the top, dropping
      // the preview's scroll position. Re-apply the editor's current position so the
      // preview keeps following the text without the author having to scroll. The iframe
      // already reloads to the top, so there is nothing to restore at the very start.
      const position = scrollPositionRef.current;
      if (position.segmentIndex <= 0 && position.localRatio <= 0) return;
      lastPostedPositionRef.current = position;
      iframeRef.current?.contentWindow?.postMessage({ type: 'sync-scroll', ...position }, '*');
    },
    [onPageCountChange],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const documentHtml = useMemo(() => {
    const displayed = switchPublicationProfile(renderedContent, profileId, overrides).content;
    const { content: tagged } = tagWordAnchors(displayed as JSONContent, WORDS_PER_SCROLL_SEGMENT);
    return renderer.render({
      bodyHtml: converter.convert(tagged),
      profile: PublicationProfile.fromId(profileId),
      assetBaseUrl:
        typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
      startPageNumber,
      levelStyles,
      honorBlankLines,
    });
  }, [
    converter,
    honorBlankLines,
    levelStyles,
    overrides,
    profileId,
    renderedContent,
    renderer,
    startPageNumber,
  ]);

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
