// ABOUTME: Tests for server-action rate limit helpers
// ABOUTME: Verifies metadata and chapter generation cooldowns are isolated

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canGenerateChapter,
  canGenerateMetadata,
  cleanupChapterGenerationEntries,
  cleanupMetadataGenerationEntries,
  cleanupTelemetryEntries,
  consumeTelemetryQuota,
  recordChapterGeneration,
  recordMetadataGeneration,
  TELEMETRY_MAX_PER_WINDOW,
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

  it('cleans chapter and metadata limiter entries independently', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'cleanup-user-1';

    recordMetadataGeneration(userId, 'characters');
    recordChapterGeneration(userId, 'chapter-full');

    vi.advanceTimersByTime(60_001);
    cleanupMetadataGenerationEntries();

    expect(canGenerateMetadata(userId, 'characters').allowed).toBe(true);
    expect(canGenerateChapter(userId, 'chapter-full').allowed).toBe(true);

    recordMetadataGeneration(userId, 'characters');
    recordChapterGeneration(userId, 'chapter-full');

    vi.advanceTimersByTime(60_001);
    cleanupChapterGenerationEntries();

    expect(canGenerateChapter(userId, 'chapter-full').allowed).toBe(true);
  });
});

describe('telemetry sliding-window rate limiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows a burst up to the window limit then blocks with a retry hint', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'telemetry-user-1';

    for (let i = 0; i < TELEMETRY_MAX_PER_WINDOW; i++) {
      expect(consumeTelemetryQuota(userId).allowed).toBe(true);
    }

    const blocked = consumeTelemetryQuota(userId);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('frees capacity once the window slides past old hits', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'telemetry-user-2';

    for (let i = 0; i < TELEMETRY_MAX_PER_WINDOW; i++) {
      consumeTelemetryQuota(userId);
    }
    expect(consumeTelemetryQuota(userId).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(consumeTelemetryQuota(userId).allowed).toBe(true);
  });

  it('isolates quotas by user', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));

    for (let i = 0; i < TELEMETRY_MAX_PER_WINDOW; i++) {
      consumeTelemetryQuota('telemetry-user-3');
    }

    expect(consumeTelemetryQuota('telemetry-user-3').allowed).toBe(false);
    expect(consumeTelemetryQuota('telemetry-user-4').allowed).toBe(true);
  });

  it('drops stale entries on cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    const userId = 'telemetry-user-5';

    consumeTelemetryQuota(userId);
    vi.advanceTimersByTime(60_001);
    cleanupTelemetryEntries();

    // After cleanup the window starts fresh — a full burst is allowed again.
    for (let i = 0; i < TELEMETRY_MAX_PER_WINDOW; i++) {
      expect(consumeTelemetryQuota(userId).allowed).toBe(true);
    }
  });
});
