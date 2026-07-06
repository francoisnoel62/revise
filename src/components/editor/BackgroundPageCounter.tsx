// ABOUTME: Silently renders one uncached chapter at a time in a hidden off-screen iframe.
// ABOUTME: Populates the page-count cache for all preceding chapters so offsets are ready.

'use client';

import type { JSONContent } from '@tiptap/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { switchPublicationProfile } from '@/application/rendering/PublicationProfileSwitch';
import {
  PublicationProfile,
  type PublicationProfileId,
} from '@/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';

const renderer = new PagedJsRenderer();
const converter = new TipTapToBookHtml();

interface BackgroundPageCounterProps {
  /** ID of the chapter to render; null = nothing to do. */
  readonly chapterId: string | null;
  /** Raw TipTap JSON string for that chapter. */
  readonly content: string | null;
  readonly profileId: PublicationProfileId;
  /** Called once the hidden iframe reports the page count. */
  readonly onPageCount: (chapterId: string, count: number) => void;
  readonly levelStyles?: LevelStyleSetProperties;
}

/**
 * Renders a single chapter in an off-screen iframe and reports its page count.
 * The parent is responsible for cycling through the queue by updating `chapterId`
 * when this component calls `onPageCount`.
 */
export function BackgroundPageCounter({
  chapterId,
  content,
  profileId,
  onPageCount,
  levelStyles,
}: BackgroundPageCounterProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentChapterIdRef = useRef<string | null>(chapterId);

  useEffect(() => {
    currentChapterIdRef.current = chapterId;
  }, [chapterId]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type !== 'paged-rendered') return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const id = currentChapterIdRef.current;
      if (id) onPageCount(id, event.data.pageCount as number);
    },
    [onPageCount],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const html = useMemo(() => {
    if (!chapterId || !content) return null;
    try {
      const parsed = JSON.parse(content) as JSONContent;
      const displayed = switchPublicationProfile(parsed, profileId, []).content;
      return renderer.render({
        bodyHtml: converter.convert(displayed as JSONContent),
        profile: PublicationProfile.fromId(profileId),
        assetBaseUrl: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
        sourceId: chapterId,
        levelStyles,
      });
    } catch {
      return null;
    }
  }, [chapterId, content, levelStyles, profileId]);

  if (!html) return null;

  return (
    <iframe
      ref={iframeRef}
      aria-hidden="true"
      // Off-screen but still in the DOM so scripts execute
      className="pointer-events-none fixed"
      data-testid="background-page-counter"
      sandbox="allow-same-origin allow-scripts"
      srcDoc={html}
      style={{ left: '-9999px', top: '-9999px', width: '800px', height: '1200px' }}
      title="background-page-counter"
    />
  );
}
