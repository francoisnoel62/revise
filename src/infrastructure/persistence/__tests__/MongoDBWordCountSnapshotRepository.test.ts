// ABOUTME: Tests for MongoDBWordCountSnapshotRepository
// ABOUTME: Verifies CRUD operations and multi-tenant isolation for word count snapshots

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBWordCountSnapshotRepository } from '../MongoDBWordCountSnapshotRepository';
import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import { Db, ObjectId } from 'mongodb';

describe('MongoDBWordCountSnapshotRepository', () => {
  let repository: MongoDBWordCountSnapshotRepository;
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      insertOne: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      updateOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    repository = new MongoDBWordCountSnapshotRepository(mockDb as unknown as Db);
  });

  describe('upsert', () => {
    it('creates a new snapshot when none exists', async () => {
      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        1500,
        new Date('2026-01-22T12:00:00.000Z')
      );

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ insertedId: snapshot.getId() });

      const result = await repository.upsert('user-1', snapshot);

      expect(result.getWordCount()).toBe(1500);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('updates existing snapshot when one exists for same date', async () => {
      const existingId = new ObjectId();
      const existingDoc = {
        _id: existingId,
        projectId: 'project-1',
        ownerId: 'user-1',
        date: new Date('2026-01-22T00:00:00.000Z'),
        wordCount: 1000,
        createdAt: new Date('2026-01-22T10:00:00.000Z'),
      };

      mockCollection.findOne.mockResolvedValue(existingDoc);
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        1500,
        new Date('2026-01-22T12:00:00.000Z')
      );

      const result = await repository.upsert('user-1', snapshot);

      expect(result.getWordCount()).toBe(1500);
      expect(result.getId()).toBe(existingId.toHexString());
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: existingId },
        { $set: { wordCount: 1500 } }
      );
    });

    it('throws error when owner does not match', async () => {
      const snapshot = WordCountSnapshot.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        1500
      );

      await expect(repository.upsert('user-2', snapshot)).rejects.toThrow(
        'Snapshot owner does not match user'
      );
    });
  });

  describe('findByDate', () => {
    it('returns snapshot when found', async () => {
      const snapshotId = new ObjectId();
      const mockDoc = {
        _id: snapshotId,
        projectId: 'project-1',
        ownerId: 'user-1',
        date: new Date('2026-01-22T00:00:00.000Z'),
        wordCount: 1500,
        createdAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findByDate(
        'user-1',
        'project-1',
        new Date('2026-01-22T12:00:00.000Z')
      );

      expect(result).not.toBeNull();
      expect(result?.getWordCount()).toBe(1500);
    });

    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByDate(
        'user-1',
        'project-1',
        new Date('2026-01-22T12:00:00.000Z')
      );

      expect(result).toBeNull();
    });
  });

  describe('findLatestBefore', () => {
    it('returns most recent snapshot before date', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        projectId: 'project-1',
        ownerId: 'user-1',
        date: new Date('2026-01-21T00:00:00.000Z'),
        wordCount: 1200,
        createdAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findLatestBefore(
        'user-1',
        'project-1',
        new Date('2026-01-22T12:00:00.000Z')
      );

      expect(result).not.toBeNull();
      expect(result?.getWordCount()).toBe(1200);
    });

    it('returns null when no snapshot exists before date', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findLatestBefore(
        'user-1',
        'project-1',
        new Date('2026-01-22T12:00:00.000Z')
      );

      expect(result).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    it('returns snapshots within range', async () => {
      const mockDocs = [
        {
          _id: new ObjectId(),
          projectId: 'project-1',
          ownerId: 'user-1',
          date: new Date('2026-01-20T00:00:00.000Z'),
          wordCount: 1000,
          createdAt: new Date(),
        },
        {
          _id: new ObjectId(),
          projectId: 'project-1',
          ownerId: 'user-1',
          date: new Date('2026-01-21T00:00:00.000Z'),
          wordCount: 1200,
          createdAt: new Date(),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockDocs),
        }),
      });

      const result = await repository.findByDateRange(
        'user-1',
        'project-1',
        new Date('2026-01-20T00:00:00.000Z'),
        new Date('2026-01-22T00:00:00.000Z')
      );

      expect(result).toHaveLength(2);
      expect(result[0].getWordCount()).toBe(1000);
      expect(result[1].getWordCount()).toBe(1200);
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all snapshots for owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await repository.deleteAllByOwner('user-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    });
  });

  describe('deleteAllByProject', () => {
    it('deletes all snapshots for project', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await repository.deleteAllByProject('user-1', 'project-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        ownerId: 'user-1',
        projectId: 'project-1',
      });
    });
  });
});
