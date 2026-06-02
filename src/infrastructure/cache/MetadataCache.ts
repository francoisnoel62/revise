// ABOUTME: In-memory cache for the project completion context block to reduce database queries
// ABOUTME: Uses TTL-based expiration and provides cache invalidation methods

interface CacheEntry {
  data: string;
  timestamp: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class MetadataCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Generate cache key from user and project IDs.
   */
  private getKey(userId: string, projectId: string): string {
    return `${userId}:${projectId}`;
  }

  /**
   * Get cached metadata if available and not expired.
   */
  get(userId: string, projectId: string): string | null {
    const key = this.getKey(userId, projectId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store metadata in cache.
   */
  set(userId: string, projectId: string, data: string): void {
    const key = this.getKey(userId, projectId);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific project.
   * Call this when metadata is updated.
   */
  invalidate(userId: string, projectId: string): void {
    const key = this.getKey(userId, projectId);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a user.
   */
  invalidateUser(userId: string): void {
    const prefix = `${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for monitoring.
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance for application-wide caching
export const metadataCache = new MetadataCache();
