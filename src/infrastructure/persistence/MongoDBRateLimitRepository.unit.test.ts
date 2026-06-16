// ABOUTME: Unit tests for MongoDBRateLimitRepository fixed-window logic
// ABOUTME: Uses a fake in-memory collection to verify counting, blocking, and window reset

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Db } from 'mongodb';
import { MongoDBRateLimitRepository } from './MongoDBRateLimitRepository';

/** Fake collection that mimics findOneAndUpdate($inc, upsert, returnDocument:'after'). */
function makeFakeDb() {
  const store = new Map<string, { _id: string; count: number; expiresAt: Date }>();
  const findOneAndUpdate = vi.fn(async (filter: { _id: string }, update: never) => {
    const u = update as { $inc: { count: number }; $setOnInsert: { expiresAt: Date } };
    const existing = store.get(filter._id);
    const next = existing
      ? { ...existing, count: existing.count + u.$inc.count }
      : { _id: filter._id, count: u.$inc.count, expiresAt: u.$setOnInsert.expiresAt };
    store.set(filter._id, next);
    return next;
  });
  const db = {
    collection: () => ({ findOneAndUpdate, createIndex: vi.fn() }),
  } as unknown as Db;
  return { db, store, findOneAndUpdate };
}

describe('MongoDBRateLimitRepository.consumeFixedWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('allows hits up to the cap then blocks with a retry hint', async () => {
    const { db } = makeFakeDb();
    const repo = new MongoDBRateLimitRepository(db);

    for (let i = 0; i < 3; i++) {
      expect((await repo.consumeFixedWindow('telemetry:u1', 60_000, 3)).allowed).toBe(true);
    }

    const blocked = await repo.consumeFixedWindow('telemetry:u1', 60_000, 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates counters by key', async () => {
    const { db } = makeFakeDb();
    const repo = new MongoDBRateLimitRepository(db);

    for (let i = 0; i < 3; i++) await repo.consumeFixedWindow('telemetry:u1', 60_000, 3);

    expect((await repo.consumeFixedWindow('telemetry:u1', 60_000, 3)).allowed).toBe(false);
    expect((await repo.consumeFixedWindow('telemetry:u2', 60_000, 3)).allowed).toBe(true);
  });

  it('frees capacity in the next window', async () => {
    const { db } = makeFakeDb();
    const repo = new MongoDBRateLimitRepository(db);

    for (let i = 0; i < 3; i++) await repo.consumeFixedWindow('telemetry:u1', 60_000, 3);
    expect((await repo.consumeFixedWindow('telemetry:u1', 60_000, 3)).allowed).toBe(false);

    // Cross into the next fixed window → a new bucket id → fresh budget.
    vi.advanceTimersByTime(60_000);
    expect((await repo.consumeFixedWindow('telemetry:u1', 60_000, 3)).allowed).toBe(true);
  });
});
