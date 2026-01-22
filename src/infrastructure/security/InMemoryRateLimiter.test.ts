// ABOUTME: Tests for InMemoryRateLimiter.
// ABOUTME: Verifies rate limiting logic for registration and other actions.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InMemoryRateLimiter } from './InMemoryRateLimiter';

describe('InMemoryRateLimiter', () => {
  let rateLimiter: InMemoryRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new InMemoryRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkLimit', () => {
    it('allows first attempt', async () => {
      const result = await rateLimiter.checkLimit('127.0.0.1', 'registration');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('tracks multiple attempts', async () => {
      await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      await rateLimiter.recordAttempt('127.0.0.1', 'registration');

      const result = await rateLimiter.checkLimit('127.0.0.1', 'registration');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(3);
    });

    it('blocks after max attempts exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      }

      const result = await rateLimiter.checkLimit('127.0.0.1', 'registration');

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });

    it('resets after window expires', async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      }

      // Verify blocked
      let result = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      expect(result.allowed).toBe(false);

      // Advance time past the window (1 hour for registration)
      vi.advanceTimersByTime(3601 * 1000);

      // Should be allowed again
      result = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('tracks different IPs separately', async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      }

      const result1 = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      const result2 = await rateLimiter.checkLimit('192.168.1.1', 'registration');

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });

    it('tracks different actions separately', async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      }

      const result1 = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      const result2 = await rateLimiter.checkLimit('127.0.0.1', 'login');

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('resetLimit', () => {
    it('clears rate limit for identifier and action', async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordAttempt('127.0.0.1', 'registration');
      }

      let result = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      expect(result.allowed).toBe(false);

      await rateLimiter.resetLimit('127.0.0.1', 'registration');

      result = await rateLimiter.checkLimit('127.0.0.1', 'registration');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('custom configurations', () => {
    it('respects custom rate limit config', async () => {
      const customLimiter = new InMemoryRateLimiter({
        custom: { maxAttempts: 2, windowSeconds: 60 },
      });

      await customLimiter.recordAttempt('127.0.0.1', 'custom');
      await customLimiter.recordAttempt('127.0.0.1', 'custom');

      const result = await customLimiter.checkLimit('127.0.0.1', 'custom');

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });
  });
});
