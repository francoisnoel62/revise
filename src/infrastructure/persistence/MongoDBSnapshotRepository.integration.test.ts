// ABOUTME: Integration tests for MongoDBSnapshotRepository against a real MongoDB
// ABOUTME: Verifies atomic never-reused numbering, ordering, and owner isolation — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBSnapshotRepository } from './MongoDBSnapshotRepository';
import { Snapshot } from '@/domain/entities/Snapshot';

const COLLECTION = 'snapshots';
const COUNTERS_COLLECTION = 'snapshotCounters';

function buildSnapshot(
  ownerId: string,
  projectId: string,
  number: number,
  overrides: Partial<{ id: string; createdAt: Date }> = {}
): Snapshot {
  return new Snapshot({
    id: overrides.id ?? randomUUID(),
    projectId,
    ownerId,
    authorId: ownerId,
    number,
    type: 'manual',
    title: `Version ${number}`,
    comment: null,
    projectTitle: 'Roman de test',
    chapters: [
      { id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 },
    ],
    editorialMetadata: null,
    createdAt: overrides.createdAt,
  });
}

describe('MongoDBSnapshotRepository — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;
  let repository: MongoDBSnapshotRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    projectId = `project-${randomUUID()}`;
    repository = new MongoDBSnapshotRepository(db);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
    await db.collection(COUNTERS_COLLECTION).deleteMany({ ownerId });
  });

  it('allocates sequential numbers starting at 1, never reused, even under concurrent calls', async () => {
    const numbers = await Promise.all(
      Array.from({ length: 10 }, () => repository.getNextSequenceNumber(ownerId, projectId))
    );

    expect([...numbers].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('never reuses a number even when the snapshot for an allocated number is never saved', async () => {
    const first = await repository.getNextSequenceNumber(ownerId, projectId);
    // Simulate a failed creation: the number is allocated but no snapshot is saved for it.
    const second = await repository.getNextSequenceNumber(ownerId, projectId);

    expect(first).toBe(1);
    expect(second).toBe(2);

    const snapshots = await repository.findByProjectId(ownerId, projectId);
    expect(snapshots).toHaveLength(0);
  });

  it('scopes numbering per project — two projects each start at 1', async () => {
    const otherProjectId = `project-${randomUUID()}`;

    const a1 = await repository.getNextSequenceNumber(ownerId, projectId);
    const b1 = await repository.getNextSequenceNumber(ownerId, otherProjectId);
    const a2 = await repository.getNextSequenceNumber(ownerId, projectId);

    expect(a1).toBe(1);
    expect(b1).toBe(1);
    expect(a2).toBe(2);
  });

  it('saves a snapshot and round-trips it through findById', async () => {
    const snapshot = buildSnapshot(ownerId, projectId, 1);
    await repository.save(ownerId, snapshot);

    const found = await repository.findById(ownerId, snapshot.getId());

    expect(found).not.toBeNull();
    expect(found?.getNumber()).toBe(1);
    expect(found?.getTitle()).toBe('Version 1');
    expect(found?.getChapters()).toEqual(snapshot.getChapters());
  });

  it('returns null from findById for a snapshot owned by someone else', async () => {
    const snapshot = buildSnapshot(ownerId, projectId, 1);
    await repository.save(ownerId, snapshot);

    const found = await repository.findById(`other-${randomUUID()}`, snapshot.getId());

    expect(found).toBeNull();
  });

  it('findByProjectId returns snapshots sorted by number descending, scoped to the owner', async () => {
    const otherOwnerId = `test-integration-other-${randomUUID()}`;
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 1));
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 2));
    await repository.save(otherOwnerId, buildSnapshot(otherOwnerId, projectId, 1));

    const snapshots = await repository.findByProjectId(ownerId, projectId);

    expect(snapshots.map((s) => s.getNumber())).toEqual([2, 1]);

    await db.collection(COLLECTION).deleteMany({ ownerId: otherOwnerId });
    await db.collection(COUNTERS_COLLECTION).deleteMany({ ownerId: otherOwnerId });
  });

  it('loads a chronological page and continuation cursor without returning the whole history', async () => {
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 1));
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 2));
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 3));

    const firstPage = await repository.findPageByProjectId(ownerId, projectId, { limit: 2 });
    const secondPage = await repository.findPageByProjectId(ownerId, projectId, {
      limit: 2,
      beforeNumber: firstPage.nextBeforeNumber ?? undefined,
    });

    expect(firstPage.snapshots.map((snapshot) => snapshot.getNumber())).toEqual([3, 2]);
    expect(firstPage.nextBeforeNumber).toBe(2);
    expect(secondPage.snapshots.map((snapshot) => snapshot.getNumber())).toEqual([1]);
    expect(secondPage.nextBeforeNumber).toBeNull();
  });

  it('findLatestByProjectId returns the highest-numbered snapshot', async () => {
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 1));
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 2));

    const latest = await repository.findLatestByProjectId(ownerId, projectId);

    expect(latest?.getNumber()).toBe(2);
  });

  it('findLatestByProjectId returns null when no snapshot exists', async () => {
    const latest = await repository.findLatestByProjectId(ownerId, projectId);

    expect(latest).toBeNull();
  });

  it('deleteByProjectId removes snapshots and resets numbering for that project only', async () => {
    const otherProjectId = `project-${randomUUID()}`;
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 1));
    await repository.getNextSequenceNumber(ownerId, otherProjectId);

    await repository.deleteByProjectId(ownerId, projectId);

    expect(await repository.findByProjectId(ownerId, projectId)).toHaveLength(0);
    // Numbering starts over for a project whose counter was deleted.
    expect(await repository.getNextSequenceNumber(ownerId, projectId)).toBe(1);
    // A different project's counter is untouched.
    expect(await repository.getNextSequenceNumber(ownerId, otherProjectId)).toBe(2);
  });

  it('deleteAllByOwner removes every snapshot and counter for that owner', async () => {
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 1));
    await repository.save(ownerId, buildSnapshot(ownerId, projectId, 2));

    const deletedCount = await repository.deleteAllByOwner(ownerId);

    expect(deletedCount).toBe(2);
    expect(await repository.findByProjectId(ownerId, projectId)).toHaveLength(0);
    expect(await repository.getNextSequenceNumber(ownerId, projectId)).toBe(1);
  });

  it('rejects saving a snapshot whose ownerId does not match the caller', async () => {
    const snapshot = buildSnapshot(ownerId, projectId, 1);

    await expect(repository.save(`other-${randomUUID()}`, snapshot)).rejects.toThrow(
      'Snapshot ownerId does not match ownerId'
    );
  });
});
