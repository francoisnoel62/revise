// ABOUTME: Tests for useBookPageOffset — verifies that client-side page count cache
// ABOUTME: correctly computes chapter start pages and invalidates on profile change.

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBookPageOffset } from './useBookPageOffset';

const CHAPTERS = [
  { id: 'ch1' },
  { id: 'ch2' },
  { id: 'ch3' },
];

describe('useBookPageOffset', () => {
  describe('startPageNumber', () => {
    it('returns 1 for the first chapter regardless of cache state', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch1', profileId: 'kdp-6x9' })
      );
      expect(result.current.startPageNumber).toBe(1);
    });

    it('returns 1 for chapter 2 when chapter 1 page count is unknown', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch2', profileId: 'kdp-6x9' })
      );
      expect(result.current.startPageNumber).toBe(1);
    });

    it('returns correct start page for chapter 2 once chapter 1 page count is known', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch2', profileId: 'kdp-6x9' })
      );

      // ch1 reports 10 pages → ch2 should start at page 11
      act(() => {
        result.current.onPageCountChange('ch1', 10);
      });

      expect(result.current.startPageNumber).toBe(11);
    });

    it('computes cascading offsets for a 3-chapter book', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch3', profileId: 'kdp-6x9' })
      );

      // ch1 ends on page 10 (even) → ch2 starts at 11
      // ch2 ends on page 15 (odd) → blank page 16 → ch3 starts at 17
      act(() => {
        result.current.onPageCountChange('ch1', 10);
        result.current.onPageCountChange('ch2', 5);
      });

      expect(result.current.startPageNumber).toBe(17);
    });
  });

  describe('cache invalidation on profile change', () => {
    it('resets to page 1 for chapter 2 when the profile changes', () => {
      type Props = { profileId: 'kdp-6x9' | 'passerelle' };
      const { result, rerender } = renderHook(
        ({ profileId }: Props) =>
          useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch2', profileId }),
        { initialProps: { profileId: 'kdp-6x9' } as Props }
      );

      // Populate cache for kdp-6x9
      act(() => {
        result.current.onPageCountChange('ch1', 10);
      });
      expect(result.current.startPageNumber).toBe(11);

      // Change profile → cache should clear → ch2 falls back to page 1
      rerender({ profileId: 'passerelle' });
      expect(result.current.startPageNumber).toBe(1);
    });

    it('accumulates new page counts after profile change', () => {
      type Props = { profileId: 'kdp-6x9' | 'passerelle' };
      const { result, rerender } = renderHook(
        ({ profileId }: Props) =>
          useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch2', profileId }),
        { initialProps: { profileId: 'kdp-6x9' } as Props }
      );

      act(() => {
        result.current.onPageCountChange('ch1', 10);
      });

      rerender({ profileId: 'passerelle' });

      // New page count for passerelle profile (different page size → different count)
      act(() => {
        result.current.onPageCountChange('ch1', 8);
      });
      expect(result.current.startPageNumber).toBe(9);
    });
  });

  describe('content version invalidation', () => {
    it('evicts an upstream chapter from the cache when its contentVersion changes', () => {
      type Props = { chapters: { id: string; contentVersion?: string }[] };
      const initialChapters = [
        { id: 'ch1', contentVersion: 'v1' },
        { id: 'ch2', contentVersion: 'v1' },
        { id: 'ch3', contentVersion: 'v1' },
      ];

      const { result, rerender } = renderHook(
        ({ chapters }: Props) =>
          useBookPageOffset({ chapters, activeChapterId: 'ch3', profileId: 'kdp-6x9' }),
        { initialProps: { chapters: initialChapters } }
      );

      // Populate cache for all chapters
      act(() => {
        result.current.onPageCountChange('ch1', 10);
        result.current.onPageCountChange('ch2', 5);
        result.current.onPageCountChange('ch3', 3);
      });
      expect(result.current.startPageNumber).toBe(17);

      // ch1 content changes → its page count is evicted
      rerender({
        chapters: [
          { id: 'ch1', contentVersion: 'v2' }, // changed
          { id: 'ch2', contentVersion: 'v1' },
          { id: 'ch3', contentVersion: 'v1' },
        ],
      });

      // ch1 evicted → ch2 and ch3 offsets can no longer be computed → fall back to 1
      expect(result.current.startPageNumber).toBe(1);
    });

    it('does not evict a chapter when only other chapters change', () => {
      type Props = { chapters: { id: string; contentVersion?: string }[] };
      const initialChapters = [
        { id: 'ch1', contentVersion: 'v1' },
        { id: 'ch2', contentVersion: 'v1' },
      ];

      const { result, rerender } = renderHook(
        ({ chapters }: Props) =>
          useBookPageOffset({ chapters, activeChapterId: 'ch2', profileId: 'kdp-6x9' }),
        { initialProps: { chapters: initialChapters } }
      );

      act(() => {
        result.current.onPageCountChange('ch1', 10);
      });
      expect(result.current.startPageNumber).toBe(11);

      // ch2 changes but ch1 does not → ch1's cache entry survives
      rerender({
        chapters: [
          { id: 'ch1', contentVersion: 'v1' }, // unchanged
          { id: 'ch2', contentVersion: 'v2' }, // changed, but ch2 is the active chapter
        ],
      });

      expect(result.current.startPageNumber).toBe(11); // ch1 still cached, offset preserved
    });
  });

  describe('updating an existing page count', () => {
    it('recalculates downstream offsets when an upstream chapter page count changes', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch3', profileId: 'kdp-6x9' })
      );

      act(() => {
        result.current.onPageCountChange('ch1', 10);
        result.current.onPageCountChange('ch2', 5);
      });
      // ch1=10, ch2=5 → ch2 starts at 11, ends at 15 (odd) → ch3 at 17
      expect(result.current.startPageNumber).toBe(17);

      // ch1 changes to 12 pages → ch2 now starts at 13, ends at 17 (odd) → ch3 at 19
      act(() => {
        result.current.onPageCountChange('ch1', 12);
      });
      expect(result.current.startPageNumber).toBe(19);
    });
  });

  describe('nextChapterIdToRender', () => {
    it('returns null when all chapters are cached', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch3', profileId: 'kdp-6x9' })
      );

      act(() => {
        result.current.onPageCountChange('ch1', 10);
        result.current.onPageCountChange('ch2', 5);
        result.current.onPageCountChange('ch3', 3);
      });

      expect(result.current.nextChapterIdToRender).toBeNull();
    });

    it('returns the first uncached chapter preceding the active one', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: 'ch3', profileId: 'kdp-6x9' })
      );
      // ch1 and ch2 uncached → returns ch1 first
      expect(result.current.nextChapterIdToRender).toBe('ch1');

      act(() => {
        result.current.onPageCountChange('ch1', 10);
      });
      // ch1 now cached → ch2 is next
      expect(result.current.nextChapterIdToRender).toBe('ch2');
    });

    it('returns a chapter after the active one once all preceding are cached', () => {
      const chapters = [{ id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }, { id: 'ch4' }];
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters, activeChapterId: 'ch2', profileId: 'kdp-6x9' })
      );

      // Cache ch1 (before active) and ch2 (active itself)
      act(() => {
        result.current.onPageCountChange('ch1', 10);
        result.current.onPageCountChange('ch2', 5);
      });

      // All chapters before or at active are cached → return ch3 next
      expect(result.current.nextChapterIdToRender).toBe('ch3');
    });

    it('returns null when there are no chapters', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: [], activeChapterId: null, profileId: 'kdp-6x9' })
      );
      expect(result.current.nextChapterIdToRender).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns 1 when there is no active chapter', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: CHAPTERS, activeChapterId: null, profileId: 'kdp-6x9' })
      );
      expect(result.current.startPageNumber).toBe(1);
    });

    it('returns 1 when the chapter list is empty', () => {
      const { result } = renderHook(() =>
        useBookPageOffset({ chapters: [], activeChapterId: null, profileId: 'kdp-6x9' })
      );
      expect(result.current.startPageNumber).toBe(1);
    });
  });
});
