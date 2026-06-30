// ABOUTME: Manages a client-side page-count cache to compute book-wide page offsets.
// ABOUTME: Cache is keyed by profileId so profile changes trigger a full recompute.

import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Cache: chapterId → pageCount (scoped to current profile)
  const [pageCountMap, setPageCountMap] = useState<Map<string, number>>(new Map());
  const prevProfileIdRef = useRef<PublicationProfileId>(profileId);

  // Invalidate entire cache when profile changes
  if (prevProfileIdRef.current !== profileId) {
    prevProfileIdRef.current = profileId;
    setPageCountMap(new Map());
  }

  // Track content versions; evict individual entries when upstream content changes
  const prevVersionsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const prevVersions = prevVersionsRef.current;
    const changedIds: string[] = [];
    for (const chapter of chapters) {
      const version = chapter.contentVersion ?? '';
      const prev = prevVersions.get(chapter.id);
      if (prev !== undefined && prev !== version) changedIds.push(chapter.id);
    }
    // Build the new version map regardless of whether anything changed
    const newVersions = new Map(chapters.map((c) => [c.id, c.contentVersion ?? '']));
    prevVersionsRef.current = newVersions;

    if (changedIds.length > 0) {
      setPageCountMap((prev) => {
        const next = new Map(prev);
        for (const id of changedIds) next.delete(id);
        return next;
      });
    }
  });

  const onPageCountChange = useCallback((chapterId: string, count: number) => {
    setPageCountMap((prev) => {
      if (prev.get(chapterId) === count) return prev;
      const next = new Map(prev);
      next.set(chapterId, count);
      return next;
    });
  }, []);

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
