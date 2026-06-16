// ABOUTME: Unit tests for MongoDBCanonFactRepository.replaceDerived resilience
// ABOUTME: A failed insert must never delete the previous derived facts (no empty ledger)

import { describe, it, expect, vi } from 'vitest';
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { MongoDBCanonFactRepository } from './MongoDBCanonFactRepository';
import { CanonFact } from '@/domain/entities/CanonFact';

function buildFact(statement: string): CanonFact {
  return CanonFact.create({
    id: new ObjectId().toHexString(),
    ownerId: 'owner-1',
    projectId: 'project-1',
    entity: 'Léa',
    statement,
    validFromChapter: 0,
    validToChapter: null,
    source: 'derived',
    sourceChapterId: null,
    contentHash: 'hash-new',
  });
}

/** Build a fake Mongo collection capturing call order; insertMany can be made to throw. */
function makeFakeDb(options: { insertThrows?: boolean }) {
  const previousIds = [new ObjectId(), new ObjectId()];
  const insertMany = options.insertThrows
    ? vi.fn().mockRejectedValue(new Error('insert failed'))
    : vi.fn().mockResolvedValue({ insertedCount: 1 });
  const deleteMany = vi.fn().mockResolvedValue({ deletedCount: 2 });
  const toArray = vi.fn().mockResolvedValue(previousIds.map((_id) => ({ _id })));
  const find = vi.fn().mockReturnValue({ toArray });

  const collection = { find, insertMany, deleteMany };
  const db = { collection: vi.fn().mockReturnValue(collection) } as unknown as Db;
  return { db, find, insertMany, deleteMany };
}

describe('MongoDBCanonFactRepository.replaceDerived — resilience', () => {
  it('keeps previous derived facts when the insert fails', async () => {
    const { db, insertMany, deleteMany } = makeFakeDb({ insertThrows: true });
    const repo = new MongoDBCanonFactRepository(db);

    await expect(
      repo.replaceDerived('owner-1', 'project-1', [buildFact('nouveau')])
    ).rejects.toThrow('insert failed');

    expect(insertMany).toHaveBeenCalled();
    // The old derived facts must NOT be deleted on a failed insert.
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('inserts the new batch before retiring the previous derived facts', async () => {
    const { db, insertMany, deleteMany } = makeFakeDb({ insertThrows: false });
    const repo = new MongoDBCanonFactRepository(db);

    await repo.replaceDerived('owner-1', 'project-1', [buildFact('nouveau')]);

    expect(insertMany).toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalled();
    // Insert must happen first so a crash never leaves the ledger empty.
    expect(insertMany.mock.invocationCallOrder[0]).toBeLessThan(
      deleteMany.mock.invocationCallOrder[0]
    );
  });
});
