// ABOUTME: Tests for MongoDBWordCountSnapshotRepository
// ABOUTME: Verifies day upsert, range queries, latest-before lookup, and tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBWordCountSnapshotRepository } from '../MongoDBWordCountSnapshotRepository';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import { Db, ObjectId } from 'mongodb';

describe('MongoDBWordCountSnapshotRepository', () => {
  let repository: MongoDBWordCountSnapshotRepository;
  let mockCollection: {
    updateOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  const makeDoc = (overrides: Partial<Record<string, unknown>> = {}) => ({
    _id: new ObjectId(),
    projectId: 'project-1',
    ownerId: 'user-1',
    localDate: '2026-05-31',
    totalWords: 62400,
    createdAt: new Date('2026-05-31T08:00:00.000Z'),
    updatedAt: new Date('2026-05-31T20:00:00.000Z'),
    ...overrides,
  });

  beforeEach(() => {
    mockCollection = {
      updateOne: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
      findOne: vi.fn(),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      deleteMany: vi.fn(),
      createIndex: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    repository = new MongoDBWordCountSnapshotRepository(mockDb as unknown as Db);
  });

  describe('upsertForDay', () => {
    it('upserts keyed on owner, project, and localDate then returns the persisted snapshot', async () => {
      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        '2026-05-31',
        62400
      );
      const persisted = makeDoc({ totalWords: 62400 });
      mockCollection.findOne.mockResolvedValue(persisted);

      const result = await repository.upsertForDay('user-1', snapshot);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { ownerId: 'user-1', projectId: 'project-1', localDate: '2026-05-31' },
        expect.objectContaining({
          $set: expect.objectContaining({ totalWords: 62400 }),
          $setOnInsert: expect.objectContaining({ localDate: '2026-05-31' }),
        }),
        { upsert: true }
      );
      expect(result.getTotalWords()).toBe(62400);
      expect(result.getLocalDate()).toBe('2026-05-31');
    });

    it('updates the total in place when the day already exists', async () => {
      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        '2026-05-31',
        63000
      );
      mockCollection.updateOne.mockResolvedValue({ upsertedCount: 0, modifiedCount: 1 });
      mockCollection.findOne.mockResolvedValue(makeDoc({ totalWords: 63000 }));

      const result = await repository.upsertForDay('user-1', snapshot);

      expect(result.getTotalWords()).toBe(63000);
    });

    it('throws when the snapshot owner does not match the user', async () => {
      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        '2026-05-31',
        62400
      );

      await expect(repository.upsertForDay('user-2', snapshot)).rejects.toThrow(
        'Snapshot owner does not match user'
      );
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('findByProjectId', () => {
    it('returns snapshots ordered by localDate ascending', async () => {
      const sort = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          makeDoc({ localDate: '2026-05-30', totalWords: 61200 }),
          makeDoc({ localDate: '2026-05-31', totalWords: 62400 }),
        ]),
      });
      mockCollection.find.mockReturnValue({ sort });

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(mockCollection.find).toHaveBeenCalledWith({
        ownerId: 'user-1',
        projectId: 'project-1',
      });
      expect(sort).toHaveBeenCalledWith({ localDate: 1 });
      expect(result.map((s) => s.getLocalDate())).toEqual(['2026-05-30', '2026-05-31']);
    });

    it('applies an inclusive date range when provided', async () => {
      const sort = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
      mockCollection.find.mockReturnValue({ sort });

      await repository.findByProjectId('user-1', 'project-1', {
        fromDate: '2026-05-01',
        toDate: '2026-05-31',
      });

      expect(mockCollection.find).toHaveBeenCalledWith({
        ownerId: 'user-1',
        projectId: 'project-1',
        localDate: { $gte: '2026-05-01', $lte: '2026-05-31' },
      });
    });
  });

  describe('findLatestBefore', () => {
    it('returns the most recent snapshot strictly before the given date', async () => {
      mockCollection.findOne.mockResolvedValue(makeDoc({ localDate: '2026-05-30' }));

      const result = await repository.findLatestBefore('user-1', 'project-1', '2026-05-31');

      expect(mockCollection.findOne).toHaveBeenCalledWith(
        { ownerId: 'user-1', projectId: 'project-1', localDate: { $lt: '2026-05-31' } },
        { sort: { localDate: -1 } }
      );
      expect(result?.getLocalDate()).toBe('2026-05-30');
    });

    it('returns null when there is no earlier snapshot', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findLatestBefore('user-1', 'project-1', '2026-05-31');

      expect(result).toBeNull();
    });
  });

  describe('deleteAllByOwner', () => {
    it('removes every snapshot for the owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await repository.deleteAllByOwner('user-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    });
  });
});
