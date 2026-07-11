// ABOUTME: Tests for MongoDBCustomAnnexRepository — CRUD, ordering, and ownerId isolation.
// ABOUTME: Uses a mocked MongoDB collection (no live database).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoDBCustomAnnexRepository } from '../MongoDBCustomAnnexRepository';
import { CustomAnnex } from '@/domain/entities/CustomAnnex';
import type { Db } from 'mongodb';

const sortToArray = { sort: vi.fn().mockReturnValue({ toArray: vi.fn() }) };
const mockCollection = {
  createIndex: vi.fn(),
  insertOne: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn().mockReturnValue(sortToArray),
  replaceOne: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
  countDocuments: vi.fn(),
};

const mockDb = { collection: vi.fn().mockReturnValue(mockCollection) };

function annex() {
  return CustomAnnex.createEmpty('annex-1', 'proj-1', 'Présentation', 'back', 0);
}

describe('MongoDBCustomAnnexRepository', () => {
  let repo: MongoDBCustomAnnexRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.find.mockReturnValue(sortToArray);
    repo = new MongoDBCustomAnnexRepository(mockDb as unknown as Db);
  });

  it('creates non-unique projectId/ownerId and id/ownerId indexes', async () => {
    mockCollection.createIndex.mockResolvedValue('ok');
    await repo.ensureIndexes();
    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { projectId: 1, ownerId: 1 },
      { name: 'projectId_ownerId' },
    );
    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' },
    );
  });

  it('inserts on create', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'annex-1' });
    const result = await repo.create('user-1', annex());
    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(result.getId()).toBe('annex-1');
  });

  it('lists a project sorted by placement then order, filtered by ownerId', async () => {
    sortToArray.sort.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        serialize(CustomAnnex.createEmpty('a', 'proj-1', 'A', 'front', 0)),
        serialize(CustomAnnex.createEmpty('b', 'proj-1', 'B', 'back', 0)),
      ]),
    });

    const result = await repo.findByProjectId('user-1', 'proj-1');

    expect(mockCollection.find).toHaveBeenCalledWith({ projectId: 'proj-1', ownerId: 'user-1' });
    expect(sortToArray.sort).toHaveBeenCalledWith({ placement: 1, order: 1 });
    expect(result.map((a) => a.getId())).toEqual(['a', 'b']);
  });

  it('counts annexes by placement', async () => {
    mockCollection.countDocuments.mockResolvedValue(2);
    const count = await repo.countByProjectAndPlacement('user-1', 'proj-1', 'back');
    expect(mockCollection.countDocuments).toHaveBeenCalledWith({
      projectId: 'proj-1',
      ownerId: 'user-1',
      placement: 'back',
    });
    expect(count).toBe(2);
  });

  it('scopes findById and delete by ownerId', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    await repo.findById('user-1', 'annex-1');
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'annex-1', ownerId: 'user-1' });

    await repo.delete('user-1', 'annex-1');
    expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'annex-1', ownerId: 'user-1' });
  });

  it('deletes all annexes of a project and of an owner', async () => {
    mockCollection.deleteMany.mockResolvedValue({ deletedCount: 3 });
    await repo.deleteByProjectId('user-1', 'proj-1');
    expect(mockCollection.deleteMany).toHaveBeenCalledWith({ projectId: 'proj-1', ownerId: 'user-1' });

    const count = await repo.deleteAllByOwner('user-1');
    expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    expect(count).toBe(3);
  });
});

function serialize(a: CustomAnnex) {
  return {
    _id: a.getId(),
    projectId: a.getProjectId(),
    ownerId: 'user-1',
    title: a.getTitle(),
    content: a.getContent(),
    placement: a.getPlacement(),
    order: a.getOrder(),
    createdAt: a.getCreatedAt(),
    updatedAt: a.getUpdatedAt(),
  };
}
