// ABOUTME: Integration tests for the Mongo-backed automatic snapshot scheduler.
// ABOUTME: Proves one persisted server clock coordinates concurrent editor sessions.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBAutomaticSnapshotRepository } from './MongoDBAutomaticSnapshotRepository';

describe('MongoDBAutomaticSnapshotRepository — intégration', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;
  let repository: MongoDBAutomaticSnapshotRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `automatic-owner-${randomUUID()}`;
    projectId = `automatic-project-${randomUUID()}`;
    repository = new MongoDBAutomaticSnapshotRepository(db);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await Promise.all([
      db.collection('automaticSnapshotSchedules').deleteMany({ ownerId }),
      db.collection('automaticSnapshotSessions').deleteMany({ ownerId }),
    ]);
  });

  it('lets exactly one of several open sessions claim the due snapshot', async () => {
    const changedAt = new Date('2026-01-01T10:00:00Z');
    const dueAt = new Date('2026-01-01T10:05:00Z');
    await repository.configure(ownerId, projectId, 5);
    await repository.recordSavedChange(ownerId, projectId, changedAt);
    await Promise.all([
      repository.heartbeat(ownerId, projectId, 'editor-a', dueAt),
      repository.heartbeat(ownerId, projectId, 'editor-b', dueAt),
    ]);

    const claims = await Promise.all(
      Array.from({ length: 4 }, () => repository.claimDueSnapshot(ownerId, projectId, dueAt)),
    );

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await repository.hasOpenSession(ownerId, projectId, dueAt)).toBe(true);

    await repository.completeSnapshot(ownerId, projectId, 1, dueAt);
    expect(await repository.claimDueSnapshot(ownerId, projectId, dueAt)).toBeNull();
  });

  it('requires a fresh saved change after the owner changes the frequency', async () => {
    const now = new Date('2026-01-01T10:00:00Z');
    await repository.configure(ownerId, projectId, 5);
    await repository.recordSavedChange(ownerId, projectId, now);
    await repository.configure(ownerId, projectId, 15);

    expect(await repository.claimDueSnapshot(ownerId, projectId, new Date(now.getTime() + 60 * 60_000))).toBeNull();
  });
});
