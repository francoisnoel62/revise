// ABOUTME: Tests for MongoDBWritingQuotaRepository
// ABOUTME: Verifies CRUD operations and multi-tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBWritingQuotaRepository } from '../MongoDBWritingQuotaRepository';
import { WritingQuota } from '@/domain/entities/WritingQuota';
import { Db, ObjectId } from 'mongodb';

describe('MongoDBWritingQuotaRepository', () => {
  let repository: MongoDBWritingQuotaRepository;
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      insertOne: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(() => ({ sort: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })) })),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
    };
    mockDb = { collection: vi.fn(() => mockCollection) };
    repository = new MongoDBWritingQuotaRepository(mockDb as unknown as Db);
  });

  describe('create', () => {
    it('creates a quota successfully', async () => {
      const quota = WritingQuota.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'daily',
        1000
      );
      mockCollection.insertOne.mockResolvedValue({ insertedId: quota.getId() });

      const result = await repository.create('user-1', quota);

      expect(result.getId()).toBe(quota.getId());
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('throws error when owner does not match', async () => {
      const quota = WritingQuota.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'weekly',
        5000
      );

      await expect(repository.create('user-2', quota)).rejects.toThrow(
        'Quota owner does not match user'
      );
    });
  });

  describe('findByProjectId', () => {
    it('returns quotas for project', async () => {
      const mockDocs = [
        {
          _id: new ObjectId(),
          projectId: 'project-1',
          ownerId: 'user-1',
          period: 'daily',
          targetWords: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockDocs) }),
      });

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).toHaveLength(1);
      expect(result[0].getPeriod()).toBe('daily');
      expect(result[0].getTargetWords()).toBe(1000);
    });
  });

  describe('delete', () => {
    it('deletes quota successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).resolves.not.toThrow();
    });

    it('throws error when quota not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).rejects.toThrow('Quota not found or access denied');
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all quotas for owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 2 });
      await repository.deleteAllByOwner('user-1');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    });
  });
});
