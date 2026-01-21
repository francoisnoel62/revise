// ABOUTME: Tests for MongoDBWritingGoalRepository
// ABOUTME: Verifies CRUD operations and multi-tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBWritingGoalRepository } from '../MongoDBWritingGoalRepository';
import { WritingGoal } from '@/domain/entities/WritingGoal';
import { ObjectId } from 'mongodb';

describe('MongoDBWritingGoalRepository', () => {
  let repository: MongoDBWritingGoalRepository;
  let mockCollection: any;
  let mockDb: any;

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
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    repository = new MongoDBWritingGoalRepository(mockDb as any);
  });

  describe('create', () => {
    it('creates a goal successfully', async () => {
      const goal = WritingGoal.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'total',
        50000
      );

      mockCollection.insertOne.mockResolvedValue({ insertedId: goal.getId() });

      const result = await repository.create('user-1', goal);

      expect(result.getId()).toBe(goal.getId());
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('throws error when owner does not match', async () => {
      const goal = WritingGoal.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'total',
        50000
      );

      await expect(repository.create('user-2', goal)).rejects.toThrow(
        'Goal owner does not match user'
      );
    });
  });

  describe('findById', () => {
    it('returns goal when found', async () => {
      const goalId = new ObjectId();
      const mockDoc = {
        _id: goalId,
        projectId: 'project-1',
        ownerId: 'user-1',
        type: 'total',
        targetWords: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findById('user-1', goalId.toHexString());

      expect(result).not.toBeNull();
      expect(result?.getTargetWords()).toBe(50000);
    });

    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById('user-1', new ObjectId().toHexString());

      expect(result).toBeNull();
    });

    it('returns null for invalid ObjectId', async () => {
      const result = await repository.findById('user-1', 'invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('returns goals for project', async () => {
      const mockDocs = [
        {
          _id: new ObjectId(),
          projectId: 'project-1',
          ownerId: 'user-1',
          type: 'total',
          targetWords: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockDocs),
        }),
      });

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).toHaveLength(1);
      expect(result[0].getTargetWords()).toBe(50000);
    });
  });

  describe('delete', () => {
    it('deletes goal successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).resolves.not.toThrow();
    });

    it('throws error when goal not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).rejects.toThrow('Goal not found or access denied');
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all goals for owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await repository.deleteAllByOwner('user-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    });
  });
});
