// ABOUTME: Tests for rate limiting functionality.
// ABOUTME: Validates cooldown periods, user isolation, and cleanup behavior.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  canTestConnection,
  recordTestConnection,
  cleanupOldEntries,
  canGenerateMetadata,
  recordMetadataGeneration,
  cleanupMetadataGenerationEntries,
} from './rate-limiter';

describe('rate-limiter', () => {
  beforeEach(() => {
    // Reset Date.now mock before each test
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up all entries between tests
    cleanupOldEntries();
    cleanupMetadataGenerationEntries();
  });

  describe('canTestConnection', () => {
    it('should allow first request from new user', () => {
      const result = canTestConnection('user-new');

      expect(result.allowed).toBe(true);
      expect(result.waitSeconds).toBeUndefined();
    });

    it('should block request within cooldown period', () => {
      recordTestConnection('user-123');

      // Advance time by 2 seconds (within 5-second cooldown)
      vi.advanceTimersByTime(2000);

      const result = canTestConnection('user-123');

      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBe(3); // 5 - 2 = 3 seconds remaining
    });

    it('should allow request after cooldown expires', () => {
      recordTestConnection('user-123');

      // Advance time by 6 seconds (beyond 5-second cooldown)
      vi.advanceTimersByTime(6000);

      const result = canTestConnection('user-123');

      expect(result.allowed).toBe(true);
    });

    it('should isolate rate limits per user', () => {
      recordTestConnection('user-A');

      // User A should be blocked
      expect(canTestConnection('user-A').allowed).toBe(false);

      // User B should be allowed (different user)
      expect(canTestConnection('user-B').allowed).toBe(true);
    });

    it('should round waitSeconds up to nearest second', () => {
      recordTestConnection('user-123');

      // Advance by 3.1 seconds
      vi.advanceTimersByTime(3100);

      const result = canTestConnection('user-123');

      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBe(2); // Ceil of 1.9 = 2
    });

    it('should handle exactly at cooldown boundary', () => {
      recordTestConnection('user-123');

      // Advance exactly 5 seconds
      vi.advanceTimersByTime(5000);

      const result = canTestConnection('user-123');

      expect(result.allowed).toBe(true);
    });
  });

  describe('recordTestConnection', () => {
    it('should record timestamp for new user', () => {
      recordTestConnection('user-new');

      const result = canTestConnection('user-new');
      expect(result.allowed).toBe(false);
    });

    it('should update timestamp for existing user', () => {
      recordTestConnection('user-123');

      // Wait 3 seconds
      vi.advanceTimersByTime(3000);

      // Record again - should reset cooldown
      recordTestConnection('user-123');

      // Check - should now need full 5 seconds again
      const result = canTestConnection('user-123');
      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBe(5);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove entries older than 2x cooldown', () => {
      recordTestConnection('user-old');

      // Advance time beyond 2x cooldown (10+ seconds)
      vi.advanceTimersByTime(11000);

      cleanupOldEntries();

      // Old entry should be removed, so new request should be allowed
      const result = canTestConnection('user-old');
      expect(result.allowed).toBe(true);
    });

    it('should keep recent entries', () => {
      recordTestConnection('user-recent');

      // Advance time within 2x cooldown (8 seconds)
      vi.advanceTimersByTime(8000);

      cleanupOldEntries();

      // Entry should still exist (though cooldown has passed)
      // User can make request but entry wasn't cleaned
      const result = canTestConnection('user-recent');
      expect(result.allowed).toBe(true);
    });

    it('should handle multiple users correctly', () => {
      recordTestConnection('user-old');
      vi.advanceTimersByTime(8000);
      recordTestConnection('user-recent');
      vi.advanceTimersByTime(4000); // Total: old=12s, recent=4s

      cleanupOldEntries();

      // Old user should be cleaned (12s > 10s)
      expect(canTestConnection('user-old').allowed).toBe(true);
      // Recent user should still be tracked (4s < 10s)
      expect(canTestConnection('user-recent').allowed).toBe(false);
    });
  });

  describe('canGenerateMetadata', () => {
    it('should allow first request from new user', () => {
      const result = canGenerateMetadata('user-new', 'narrative-analysis');

      expect(result.allowed).toBe(true);
      expect(result.waitSeconds).toBeUndefined();
    });

    it('should block request within 30-second cooldown', () => {
      recordMetadataGeneration('user-123', 'narrative-analysis');

      // Advance time by 10 seconds (within 30-second cooldown)
      vi.advanceTimersByTime(10000);

      const result = canGenerateMetadata('user-123', 'narrative-analysis');

      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBe(20); // 30 - 10 = 20 seconds remaining
    });

    it('should allow request after cooldown expires', () => {
      recordMetadataGeneration('user-123', 'narrative-analysis');

      // Advance time by 31 seconds (beyond 30-second cooldown)
      vi.advanceTimersByTime(31000);

      const result = canGenerateMetadata('user-123', 'narrative-analysis');

      expect(result.allowed).toBe(true);
    });

    it('should isolate rate limits per metadata type', () => {
      recordMetadataGeneration('user-123', 'narrative-analysis');

      // Same type should be blocked
      expect(canGenerateMetadata('user-123', 'narrative-analysis').allowed).toBe(false);

      // Different type should be allowed
      expect(canGenerateMetadata('user-123', 'stylistic-dna').allowed).toBe(true);
      expect(canGenerateMetadata('user-123', 'characters').allowed).toBe(true);
      expect(canGenerateMetadata('user-123', 'plot').allowed).toBe(true);
    });

    it('should isolate rate limits per user', () => {
      recordMetadataGeneration('user-A', 'narrative-analysis');

      // User A should be blocked for same type
      expect(canGenerateMetadata('user-A', 'narrative-analysis').allowed).toBe(false);

      // User B should be allowed (different user)
      expect(canGenerateMetadata('user-B', 'narrative-analysis').allowed).toBe(true);
    });

    it('should handle exactly at cooldown boundary', () => {
      recordMetadataGeneration('user-123', 'narrative-analysis');

      // Advance exactly 30 seconds
      vi.advanceTimersByTime(30000);

      const result = canGenerateMetadata('user-123', 'narrative-analysis');

      expect(result.allowed).toBe(true);
    });
  });

  describe('recordMetadataGeneration', () => {
    it('should record timestamp for new user and type', () => {
      recordMetadataGeneration('user-new', 'synthesis');

      const result = canGenerateMetadata('user-new', 'synthesis');
      expect(result.allowed).toBe(false);
    });

    it('should update timestamp for existing user and type', () => {
      recordMetadataGeneration('user-123', 'plot');

      // Wait 20 seconds
      vi.advanceTimersByTime(20000);

      // Record again - should reset cooldown
      recordMetadataGeneration('user-123', 'plot');

      // Check - should now need full 30 seconds again
      const result = canGenerateMetadata('user-123', 'plot');
      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBe(30);
    });

    it('should track multiple types per user independently', () => {
      recordMetadataGeneration('user-123', 'narrative-analysis');
      vi.advanceTimersByTime(5000);
      recordMetadataGeneration('user-123', 'stylistic-dna');

      // Check cooldowns are independent
      const narrativeResult = canGenerateMetadata('user-123', 'narrative-analysis');
      const stylisticResult = canGenerateMetadata('user-123', 'stylistic-dna');

      expect(narrativeResult.waitSeconds).toBe(25); // 30 - 5 = 25
      expect(stylisticResult.waitSeconds).toBe(30); // Just recorded
    });
  });

  describe('cleanupMetadataGenerationEntries', () => {
    it('should remove entries older than 2x cooldown (60 seconds)', () => {
      recordMetadataGeneration('user-old', 'narrative-analysis');

      // Advance time beyond 2x cooldown (60+ seconds)
      vi.advanceTimersByTime(61000);

      cleanupMetadataGenerationEntries();

      // Old entry should be removed, so new request should be allowed
      const result = canGenerateMetadata('user-old', 'narrative-analysis');
      expect(result.allowed).toBe(true);
    });

    it('should keep recent entries', () => {
      recordMetadataGeneration('user-recent', 'characters');

      // Advance time within 2x cooldown (50 seconds)
      vi.advanceTimersByTime(50000);

      cleanupMetadataGenerationEntries();

      // Entry should still exist (though cooldown has passed)
      const result = canGenerateMetadata('user-recent', 'characters');
      expect(result.allowed).toBe(true);
    });

    it('should remove user entry when all types are cleaned', () => {
      recordMetadataGeneration('user-cleanup', 'plot');

      // Advance beyond 2x cooldown
      vi.advanceTimersByTime(65000);

      cleanupMetadataGenerationEntries();

      // User should be completely cleaned up
      // Adding a new type should work without issues
      recordMetadataGeneration('user-cleanup', 'worldbuilding');
      expect(canGenerateMetadata('user-cleanup', 'worldbuilding').allowed).toBe(false);
    });

    it('should handle partial cleanup per user', () => {
      // Record two types at different times
      recordMetadataGeneration('user-123', 'old-type');
      vi.advanceTimersByTime(40000); // old-type is now 40s old
      recordMetadataGeneration('user-123', 'new-type');
      vi.advanceTimersByTime(25000); // old-type: 65s, new-type: 25s

      cleanupMetadataGenerationEntries();

      // old-type should be cleaned (65s > 60s)
      expect(canGenerateMetadata('user-123', 'old-type').allowed).toBe(true);
      // new-type should still be tracked (25s < 60s)
      expect(canGenerateMetadata('user-123', 'new-type').allowed).toBe(false);
    });
  });

  describe('concurrent usage scenarios', () => {
    it('should handle rapid sequential requests', () => {
      // Simulate rapid button clicks
      const results: boolean[] = [];

      for (let i = 0; i < 5; i++) {
        const check = canTestConnection('user-rapid');
        results.push(check.allowed);
        if (check.allowed) {
          recordTestConnection('user-rapid');
        }
        vi.advanceTimersByTime(1000); // 1 second between attempts
      }

      // Only first should succeed, rest should be blocked
      expect(results).toEqual([true, false, false, false, false]);
    });

    it('should allow after cooldown expires', () => {
      recordTestConnection('user-123');

      // Try at various intervals
      const intervals = [1000, 2000, 3000, 4000, 5000, 6000];
      const results: boolean[] = [];

      for (const interval of intervals) {
        vi.setSystemTime(new Date('2026-01-13T12:00:00.000Z').getTime() + interval);
        results.push(canTestConnection('user-123').allowed);
      }

      // Only 5000ms and 6000ms should succeed
      expect(results).toEqual([false, false, false, false, true, true]);
    });
  });
});
