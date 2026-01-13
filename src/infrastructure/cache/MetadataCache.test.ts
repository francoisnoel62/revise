// ABOUTME: Unit tests for MetadataCache
// ABOUTME: Tests caching, TTL expiration, and invalidation

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetadataCache, CachedMetadata } from './MetadataCache';

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

    it('should store and retrieve metadata', () => {
      const metadata: CachedMetadata = {
        narrative: {
          narratorType: 'first-person',
          focalization: 'internal',
          temporality: 'linear',
          chapterStructure: '',
          narrativeVoice: [],
          summary: '',
        },
      };

      cache.set('user1', 'project1', metadata);
      const result = cache.get('user1', 'project1');

      expect(result).toEqual(metadata);
    });

    it('should return null for expired entry', () => {
      const metadata: CachedMetadata = {
        narrative: {
          narratorType: 'first-person',
          focalization: '',
          temporality: '',
          chapterStructure: '',
          narrativeVoice: [],
          summary: '',
        },
      };

      cache.set('user1', 'project1', metadata);

      // Advance time past TTL
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      const result = cache.get('user1', 'project1');
      expect(result).toBeNull();
    });

    it('should return entry before TTL expires', () => {
      const metadata: CachedMetadata = {
        characters: {
          characterProfiles: [],
          relationalMap: 'test',
          narrativeHierarchy: '',
          summary: '',
        },
      };

      cache.set('user1', 'project1', metadata);

      // Advance time but not past TTL
      vi.advanceTimersByTime(4 * 60 * 1000); // 4 minutes

      const result = cache.get('user1', 'project1');
      expect(result).toEqual(metadata);
    });
  });

  describe('invalidate', () => {
    it('should invalidate specific project cache', () => {
      const metadata: CachedMetadata = {
        plot: {
          initialSituation: '',
          incitingIncident: '',
          stakes: '',
          dramaticQuestions: '',
          conflicts: '',
          narrativeThreads: '',
          detectedStructure: '',
          sceneBreakdown: [],
          plotState: 'in-progress',
          possibleDirections: '',
          summary: '',
        },
      };

      cache.set('user1', 'project1', metadata);
      cache.set('user1', 'project2', metadata);

      cache.invalidate('user1', 'project1');

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user1', 'project2')).toEqual(metadata);
    });
  });

  describe('invalidateUser', () => {
    it('should invalidate all projects for a user', () => {
      const metadata: CachedMetadata = {};

      cache.set('user1', 'project1', metadata);
      cache.set('user1', 'project2', metadata);
      cache.set('user2', 'project3', metadata);

      cache.invalidateUser('user1');

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user1', 'project2')).toBeNull();
      expect(cache.get('user2', 'project3')).toEqual(metadata);
    });
  });

  describe('clear', () => {
    it('should clear entire cache', () => {
      const metadata: CachedMetadata = {};

      cache.set('user1', 'project1', metadata);
      cache.set('user2', 'project2', metadata);

      cache.clear();

      expect(cache.get('user1', 'project1')).toBeNull();
      expect(cache.get('user2', 'project2')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('user1', 'project1', {});
      expect(cache.size()).toBe(1);

      cache.set('user1', 'project2', {});
      expect(cache.size()).toBe(2);

      cache.invalidate('user1', 'project1');
      expect(cache.size()).toBe(1);
    });
  });
});
