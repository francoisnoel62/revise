// ABOUTME: Tests for server-action rate limit helpers
// ABOUTME: Verifies metadata and chapter generation cooldowns are isolated

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canGenerateChapter,
  canGenerateMetadata,
  recordChapterGeneration,
  recordMetadataGeneration,
} from './rate-limiter';

describe('generation rate limiters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rate limits metadata generation by user and metadata type', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'metadata-user-1';

    expect(canGenerateMetadata(userId, 'characters').allowed).toBe(true);

    recordMetadataGeneration(userId, 'characters');

    expect(canGenerateMetadata(userId, 'characters')).toEqual({
      allowed: false,
      waitSeconds: 30,
    });
    expect(canGenerateMetadata(userId, 'plot').allowed).toBe(true);

    vi.advanceTimersByTime(30_000);
    expect(canGenerateMetadata(userId, 'characters').allowed).toBe(true);
  });

  it('rate limits chapter generation independently by type', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'chapter-user-1';

    expect(canGenerateChapter(userId, 'chapter-beginning').allowed).toBe(true);

    recordChapterGeneration(userId, 'chapter-beginning');

    expect(canGenerateChapter(userId, 'chapter-beginning')).toEqual({
      allowed: false,
      waitSeconds: 30,
    });
    expect(canGenerateChapter(userId, 'chapter-full').allowed).toBe(true);

    vi.advanceTimersByTime(30_000);
    expect(canGenerateChapter(userId, 'chapter-beginning').allowed).toBe(true);
  });

  it('chapter generation does not affect metadata cooldown with the same key', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'isolated-user-1';

    recordChapterGeneration(userId, 'chapter-summaries');

    expect(canGenerateChapter(userId, 'chapter-summaries').allowed).toBe(false);
    expect(canGenerateMetadata(userId, 'chapter-summaries').allowed).toBe(true);
  });

  it('metadata generation does not affect chapter cooldown with the same key', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'isolated-user-2';

    recordMetadataGeneration(userId, 'chapter-outline');

    expect(canGenerateMetadata(userId, 'chapter-outline').allowed).toBe(false);
    expect(canGenerateChapter(userId, 'chapter-outline').allowed).toBe(true);
  });

});
