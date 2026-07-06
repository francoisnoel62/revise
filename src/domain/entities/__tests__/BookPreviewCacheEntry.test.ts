// ABOUTME: Tests for the BookPreviewCacheEntry domain entity (whole-book PDF cache metrics).
// ABOUTME: Covers factory creation, reconstruction from storage, getters, and validation.

import { describe, expect, it } from 'vitest';
import { BookPreviewCacheEntry } from '../BookPreviewCacheEntry';

const baseProps = {
  projectId: 'proj-1',
  profileId: 'kdp-6x9' as const,
  ownerId: 'owner-1',
  contentHash: 'abc123',
  frontMatterPageCount: 4,
  totalPageCount: 312,
  chapterOffsets: [
    { chapterId: 'ch-1', pageNumber: 5 },
    { chapterId: 'ch-2', pageNumber: 41 },
  ],
};

describe('BookPreviewCacheEntry', () => {
  it('creates an entry and stamps computedAt from the given clock', () => {
    const now = new Date('2026-07-05T10:00:00Z');
    const entry = BookPreviewCacheEntry.create(baseProps, now);

    expect(entry.getProjectId()).toBe('proj-1');
    expect(entry.getProfileId()).toBe('kdp-6x9');
    expect(entry.getOwnerId()).toBe('owner-1');
    expect(entry.getContentHash()).toBe('abc123');
    expect(entry.getFrontMatterPageCount()).toBe(4);
    expect(entry.getTotalPageCount()).toBe(312);
    expect(entry.getChapterOffsets()).toEqual([
      { chapterId: 'ch-1', pageNumber: 5 },
      { chapterId: 'ch-2', pageNumber: 41 },
    ]);
    expect(entry.getComputedAt()).toEqual(now);
  });

  it('reconstructs an entry from stored properties including computedAt', () => {
    const computedAt = new Date('2026-07-01T08:30:00Z');
    const entry = BookPreviewCacheEntry.reconstruct({ ...baseProps, computedAt });

    expect(entry.getComputedAt()).toEqual(computedAt);
    expect(entry.getTotalPageCount()).toBe(312);
  });

  it('resolves the physical PDF page for a known chapter (for #page=N navigation)', () => {
    const entry = BookPreviewCacheEntry.create(baseProps, new Date());
    expect(entry.pageForChapter('ch-2')).toBe(41);
  });

  it('returns null when asked for an unknown chapter', () => {
    const entry = BookPreviewCacheEntry.create(baseProps, new Date());
    expect(entry.pageForChapter('ch-unknown')).toBeNull();
  });

  it('rejects a negative total page count', () => {
    expect(() =>
      BookPreviewCacheEntry.create({ ...baseProps, totalPageCount: -1 }, new Date()),
    ).toThrow(/totalPageCount/);
  });

  it('rejects a negative front-matter page count', () => {
    expect(() =>
      BookPreviewCacheEntry.create({ ...baseProps, frontMatterPageCount: -2 }, new Date()),
    ).toThrow(/frontMatterPageCount/);
  });

  it('rejects an empty content hash', () => {
    expect(() =>
      BookPreviewCacheEntry.create({ ...baseProps, contentHash: '' }, new Date()),
    ).toThrow(/contentHash/);
  });

  describe('subtitleOffsets (sous-titre navigation, #page=N)', () => {
    const withSubtitles = {
      ...baseProps,
      subtitleOffsets: [
        { anchorId: 'chapter-ch-1-soustitre-0', pageNumber: 6 },
        { anchorId: 'chapter-ch-2-soustitre-0', pageNumber: 42 },
      ],
    };

    it('defaults to an empty array when omitted', () => {
      const entry = BookPreviewCacheEntry.create(baseProps, new Date());
      expect(entry.getSubtitleOffsets()).toEqual([]);
    });

    it('stores and returns subtitle offsets when provided', () => {
      const entry = BookPreviewCacheEntry.create(withSubtitles, new Date());
      expect(entry.getSubtitleOffsets()).toEqual(withSubtitles.subtitleOffsets);
    });

    it('resolves the physical PDF page for a known subtitle anchor', () => {
      const entry = BookPreviewCacheEntry.create(withSubtitles, new Date());
      expect(entry.pageForSubtitle('chapter-ch-2-soustitre-0')).toBe(42);
    });

    it('returns null when asked for an unknown subtitle anchor', () => {
      const entry = BookPreviewCacheEntry.create(withSubtitles, new Date());
      expect(entry.pageForSubtitle('unknown-anchor')).toBeNull();
    });
  });
});
