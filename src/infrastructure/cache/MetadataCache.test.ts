// ABOUTME: Unit tests for MetadataCache
// ABOUTME: Tests caching, TTL expiration, and invalidation of the completion context block

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetadataCache } from './MetadataCache';

describe('MetadataCache', () => {
  let cache: MetadataCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MetadataCache(5 * 60 * 1000); // 5 minutes TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get/set', () => {
    it('should return null for non-existent key', () => {
      const result = cache.get('user1', 'project1');
      expect(result).toBeNull();
    });

    it('should store and retrieve the context block', () => {
      const context = '\n\n[MÉTADONNÉES - NARRATION]\nPoint de vue: Third person\n';

      cache.set('user1', 'project1', context);
      const result = cache.get('user1', 'project1');

      expect(result).toBe(context);
    });

    it('should distinguish a cached empty context from a cache miss', () => {
      cache.set('user1', 'project1', '');

      expect(cache.get('user1', 'project1')).toBe('');
      expect(cache.get('user1', 'absent')).toBeNull();
    });

    it('should return null for expired entry', () => {
      cache.set('user1', 'project1', 'some context');

      // Advance time past TTL
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      const result = cache.get('user1', 'project1');
      expect(result).toBeNull();
    });

    it('should return entry before TTL expires', () => {
      cache.set('user1', 'project1', 'some context');

      // Advance time but not past TTL
      vi.advanceTimersByTime(4 * 60 * 1000); // 4 minutes

      const result = cache.get('user1', 'project1');
      expect(result).toBe('some context');
    });
  });

  describe('invalidate', () => {
    it('should invalidate specific project cache', () => {
      cache.set('user1', 'project1', 'ctx');
      cache.set('user1', 'project2', 'ctx');

      cache.invalidate('user1', 'project1');

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user1', 'project2')).toBe('ctx');
    });
  });

  describe('invalidateUser', () => {
    it('should invalidate all projects for a user', () => {
      cache.set('user1', 'project1', 'ctx');
      cache.set('user1', 'project2', 'ctx');
      cache.set('user2', 'project3', 'ctx');

      cache.invalidateUser('user1');

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user1', 'project2')).toBeNull();
      expect(cache.get('user2', 'project3')).toBe('ctx');
    });
  });

  describe('clear', () => {
    it('should clear entire cache', () => {
      cache.set('user1', 'project1', 'ctx');
      cache.set('user2', 'project2', 'ctx');

      cache.clear();

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user2', 'project2')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('user1', 'project1', 'ctx');
      expect(cache.size()).toBe(1);

      cache.set('user1', 'project2', 'ctx');
      expect(cache.size()).toBe(2);

      cache.invalidate('user1', 'project1');
      expect(cache.size()).toBe(1);
    });
  });
});
