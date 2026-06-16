// ABOUTME: MongoDB implementation of RateLimitRepository (fixed-window, cross-instance)
// ABOUTME: One atomic upsert per hit; a TTL index auto-prunes expired windows

import { Db } from 'mongodb';
import {
  RateLimitRepository,
  RateLimitResult,
} from '@/domain/interfaces/RateLimitRepository';

const COLLECTION_NAME = 'rateLimits';

interface RateLimitWindowDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

export class MongoDBRateLimitRepository implements RateLimitRepository {
  constructor(private readonly db: Db) {}

  private collection() {
    return this.db.collection<RateLimitWindowDocument>(COLLECTION_NAME);
  }

  async ensureIndexes(): Promise<void> {
    // TTL index: MongoDB deletes a window document once its expiresAt passes, so
    // stale counters are cleaned up by the database — no manual sweep needed.
    await this.collection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  async consumeFixedWindow(
    key: string,
    windowMs: number,
    maxPerWindow: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const id = `${key}:${windowStart}`;

    // Single atomic increment+upsert: correct even when many instances race on
    // the same window. Keep the doc for two windows so the TTL has slack.
    const doc = await this.collection().findOneAndUpdate(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(windowStart + windowMs * 2) },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const count = doc?.count ?? 1;
    if (count > maxPerWindow) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowStart + windowMs - now) / 1000)
      );
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true };
  }
}
