// ABOUTME: Manages a client-side page-count cache to compute book-wide page offsets.
// ABOUTME: Cache is keyed by profileId so profile changes trigger a full recompute.

import { useCallback, useMemo, useState } from 'react';
import { computeBookOffsets } from '@/application/services/BookOffsetCalculator';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';

interface ChapterRef {
  readonly id: string;
  /**
   * An opaque string that changes when the chapter content changes (e.g. the
   * lastEdited ISO timestamp from the server).  When it changes, the cached
   * page count for that chapter is evicted so the background counter re-renders it.
   */
  readonly contentVersion?: string;
}

interface UseBookPageOffsetOptions {
  readonly chapters: readonly ChapterRef[];
  readonly activeChapterId: string | null;
  readonly profileId: PublicationProfileId;
}

interface UseBookPageOffsetResult {
  /** The first Arabic page number that the active chapter should display. */
  readonly startPageNumber: number;
  /** Call this when a chapter's paged preview reports its page count. */
  readonly onPageCountChange: (chapterId: string, count: number) => void;
  /**
   * The next chapter ID that should be silently rendered to populate the cache,
   * or null when all chapters needed for offset computation are already cached.
   * Prioritises chapters that precede the active one.
   */
  readonly nextChapterIdToRender: string | null;
}

type CacheEntry = { readonly count: number; readonly version: string };

/**
 * Returns the correct first page number for the active chapter based on a
 * growing cache of per-chapter page counts.  Resets automatically when
 * `profileId` changes (different geometry → different page counts).
 */
export function useBookPageOffset({
  chapters,
  activeChapterId,
  profileId,
}: UseBookPageOffsetOptions): UseBookPageOffsetResult {
  // Cache stores count + version so stale entries are detected at render time without effects
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  // Store prevProfileId in state so the comparison is a safe render-time setState (React docs pattern)
  const [prevProfileId, setPrevProfileId] = useState<PublicationProfileId>(profileId);

  // Invalidate entire cache when profile changes
  if (prevProfileId !== profileId) {
    setPrevProfileId(profileId);
    setCache(new Map());
  }

  const onPageCountChange = useCallback(
    (chapterId: string, count: number) => {
      const version = chapters.find((c) => c.id === chapterId)?.contentVersion ?? '';
      setCache((prev) => {
        const existing = prev.get(chapterId);
        if (existing?.count === count && existing.version === version) return prev;
        const next = new Map(prev);
        next.set(chapterId, { count, version });
        return next;
      });
    },
    [chapters],
  );

  // Effective page count map: entries whose stored version matches the current chapter version
  const pageCountMap = useMemo(() => {
    const result = new Map<string, number>();
    for (const chapter of chapters) {
      const entry = cache.get(chapter.id);
      if (entry && entry.version === (chapter.contentVersion ?? '')) {
        result.set(chapter.id, entry.count);
      }
    }
    return result;
  }, [cache, chapters]);

  const offsets = computeBookOffsets(chapters, pageCountMap);
  const startPageNumber =
    activeChapterId !== null ? (offsets.get(activeChapterId) ?? 1) : 1;

  // Find the next chapter that needs background rendering.
  // Prioritise chapters before the active one so we can compute the active
  // chapter's offset as quickly as possible.
  const activeIndex = chapters.findIndex((c) => c.id === activeChapterId);
  const precedingUncached = chapters
    .slice(0, activeIndex >= 0 ? activeIndex : chapters.length)
    .find((c) => !pageCountMap.has(c.id));
  const followingUncached = chapters
    .slice(activeIndex >= 0 ? activeIndex + 1 : chapters.length)
    .find((c) => !pageCountMap.has(c.id));
  const nextChapterIdToRender =
    precedingUncached?.id ?? followingUncached?.id ?? null;

  return { startPageNumber, onPageCountChange, nextChapterIdToRender };
}
