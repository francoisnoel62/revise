// ABOUTME: Tests for MongoDBSnapshotRepository
// ABOUTME: Verifies CRUD, atomic sequence numbering, and multi-tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBSnapshotRepository } from '../MongoDBSnapshotRepository';
import { Snapshot } from '@/domain/entities/Snapshot';
import type { Db } from 'mongodb';

describe('MongoDBSnapshotRepository', () => {
  let repository: MongoDBSnapshotRepository;
  let mockSnapshotsCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockCountersCollection: {
    findOneAndUpdate: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  const ownerId = 'owner-1';
  const projectId = 'project-1';

  const buildSnapshot = () =>
    new Snapshot({
      id: 'snapshot-1',
      projectId,
      ownerId,
      authorId: ownerId,
      number: 1,
      type: 'manual',
      title: 'Version 1',
      comment: null,
      projectTitle: 'Mon roman',
      chapters: [{ id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 }],
      editorialMetadata: null,
    });

  beforeEach(() => {
    mockSnapshotsCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: 'snapshot-1' }),
      find: vi.fn(),
      findOne: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      createIndex: vi.fn().mockResolvedValue(undefined),
    };

    mockCountersCollection = {
      findOneAndUpdate: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    mockDb = {
      collection: vi.fn((name: string) =>
        name === 'snapshotCounters' ? mockCountersCollection : mockSnapshotsCollection
      ),
    };

    repository = new MongoDBSnapshotRepository(mockDb as unknown as Db);
  });

  describe('getNextSequenceNumber', () => {
    it('atomically increments and returns the new sequence number', async () => {
      mockCountersCollection.findOneAndUpdate.mockResolvedValue({
        _id: projectId,
        ownerId,
        seq: 1,
      });

      const number = await repository.getNextSequenceNumber(ownerId, projectId);

      expect(number).toBe(1);
      expect(mockCountersCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: projectId, ownerId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
    });

    it('never reuses a number across calls', async () => {
      mockCountersCollection.findOneAndUpdate
        .mockResolvedValueOnce({ _id: projectId, ownerId, seq: 1 })
        .mockResolvedValueOnce({ _id: projectId, ownerId, seq: 2 });

      const first = await repository.getNextSequenceNumber(ownerId, projectId);
      const second = await repository.getNextSequenceNumber(ownerId, projectId);

      expect(first).toBe(1);
      expect(second).toBe(2);
    });
  });

  describe('save', () => {
    it('inserts the serialized snapshot', async () => {
      const snapshot = buildSnapshot();

      await repository.save(ownerId, snapshot);

      expect(mockSnapshotsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'snapshot-1', projectId, ownerId, number: 1 })
      );
    });
  });

  describe('findByProjectId', () => {
    it('queries by projectId and ownerId, sorted by number descending', async () => {
      const toArray = vi.fn().mockResolvedValue([]);
      const sort = vi.fn().mockReturnValue({ toArray });
      mockSnapshotsCollection.find.mockReturnValue({ sort });

      await repository.findByProjectId(ownerId, projectId);

      expect(mockSnapshotsCollection.find).toHaveBeenCalledWith({ projectId, ownerId });
      expect(sort).toHaveBeenCalledWith({ number: -1 });
    });
  });

  describe('findLatestByProjectId', () => {
    it('returns null when no snapshot exists', async () => {
      const sort = vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) });
      mockSnapshotsCollection.find.mockReturnValue({ sort });

      const result = await repository.findLatestByProjectId(ownerId, projectId);

      expect(result).toBeNull();
    });

    it('returns the highest-numbered snapshot', async () => {
      const doc = {
        _id: 'snapshot-2',
        projectId,
        ownerId,
        authorId: ownerId,
        number: 2,
        type: 'manual',
        title: 'Version 2',
        comment: null,
        projectTitle: 'Mon roman',
        chapters: [{ id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 }],
        editorialMetadata: null,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      };
      const sort = vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([doc]) }) });
      mockSnapshotsCollection.find.mockReturnValue({ sort });

      const result = await repository.findLatestByProjectId(ownerId, projectId);

      expect(result?.getId()).toBe('snapshot-2');
      expect(result?.getNumber()).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns null when not found', async () => {
      mockSnapshotsCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById(ownerId, 'unknown');

      expect(result).toBeNull();
      expect(mockSnapshotsCollection.findOne).toHaveBeenCalledWith({ _id: 'unknown', ownerId });
    });
  });

  describe('deleteByProjectId', () => {
    it('deletes all snapshots for the project', async () => {
      await repository.deleteByProjectId(ownerId, projectId);

      expect(mockSnapshotsCollection.deleteMany).toHaveBeenCalledWith({ projectId, ownerId });
      expect(mockCountersCollection.deleteMany).toHaveBeenCalledWith({ _id: projectId, ownerId });
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all snapshots and counters owned by the user', async () => {
      mockSnapshotsCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const count = await repository.deleteAllByOwner(ownerId);

      expect(count).toBe(5);
      expect(mockSnapshotsCollection.deleteMany).toHaveBeenCalledWith({ ownerId });
      expect(mockCountersCollection.deleteMany).toHaveBeenCalledWith({ ownerId });
    });
  });
});
