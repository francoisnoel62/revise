// ABOUTME: Tests for MongoDBProjectTaskRepository
// ABOUTME: Verifies CRUD operations and multi-tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBProjectTaskRepository } from '../MongoDBProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';
import { ObjectId } from 'mongodb';

describe('MongoDBProjectTaskRepository', () => {
  let repository: MongoDBProjectTaskRepository;
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    countDocuments: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    distinct: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      insertOne: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          skip: vi.fn(() => ({
            limit: vi.fn(() => ({
              toArray: vi.fn().mockResolvedValue([]),
            })),
            toArray: vi.fn().mockResolvedValue([]),
          })),
          limit: vi.fn(() => ({
            toArray: vi.fn().mockResolvedValue([]),
          })),
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      countDocuments: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
      distinct: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    repository = new MongoDBProjectTaskRepository(mockDb as unknown as import('mongodb').Db);
  });

  describe('create', () => {
    it('creates a task successfully', async () => {
      const task = ProjectTask.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'Test task'
      );

      mockCollection.insertOne.mockResolvedValue({ insertedId: task.getId() });

      const result = await repository.create('user-1', task);

      expect(result.getId()).toBe(task.getId());
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('throws error when owner does not match', async () => {
      const task = ProjectTask.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'Test task'
      );

      await expect(repository.create('user-2', task)).rejects.toThrow(
        'Task owner does not match user'
      );
    });
  });

  describe('findById', () => {
    it('returns task when found', async () => {
      const taskId = new ObjectId();
      const mockDoc = {
        _id: taskId,
        projectId: 'project-1',
        ownerId: 'user-1',
        title: 'Test task',
        description: null,
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        linkedChapterId: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findById('user-1', taskId.toHexString());

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe('Test task');
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
    it('returns tasks for project', async () => {
      const mockDocs = [
        {
          _id: new ObjectId(),
          projectId: 'project-1',
          ownerId: 'user-1',
          title: 'Task 1',
          description: null,
          status: 'todo',
          priority: 'high',
          dueDate: null,
          linkedChapterId: null,
          tags: [],
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
      expect(result[0].getTitle()).toBe('Task 1');
    });
  });

  describe('countByProjectId', () => {
    it('returns count of tasks', async () => {
      mockCollection.countDocuments.mockResolvedValue(5);

      const result = await repository.countByProjectId('user-1', 'project-1');

      expect(result).toBe(5);
    });

    it('applies filters when counting', async () => {
      mockCollection.countDocuments.mockResolvedValue(2);

      await repository.countByProjectId('user-1', 'project-1', { status: 'todo' });

      expect(mockCollection.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          ownerId: 'user-1',
          status: 'todo',
        })
      );
    });
  });

  describe('update', () => {
    it('updates task successfully', async () => {
      const task = ProjectTask.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'Test task'
      );

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await repository.update('user-1', task);

      expect(result.getId()).toBe(task.getId());
    });

    it('throws error when task not found', async () => {
      const task = ProjectTask.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'Test task'
      );

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      await expect(repository.update('user-1', task)).rejects.toThrow(
        'Task not found or access denied'
      );
    });

    it('throws error when owner does not match', async () => {
      const task = ProjectTask.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'Test task'
      );

      await expect(repository.update('user-2', task)).rejects.toThrow(
        'Task owner does not match user'
      );
    });
  });

  describe('delete', () => {
    it('deletes task successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).resolves.not.toThrow();
    });

    it('throws error when task not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).rejects.toThrow('Task not found or access denied');
    });

    it('throws error for invalid task ID', async () => {
      await expect(repository.delete('user-1', 'invalid-id')).rejects.toThrow(
        'Invalid task ID'
      );
    });
  });

  describe('deleteAllByProject', () => {
    it('deletes all tasks for project', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await repository.deleteAllByProject('user-1', 'project-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        projectId: 'project-1',
        ownerId: 'user-1',
      });
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all tasks for owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 10 });

      await repository.deleteAllByOwner('user-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        ownerId: 'user-1',
      });
    });
  });

  describe('getTagsByProject', () => {
    it('returns unique tags', async () => {
      mockCollection.distinct.mockResolvedValue(['research', 'urgent', 'chapter1']);

      const result = await repository.getTagsByProject('user-1', 'project-1');

      expect(result).toEqual(['chapter1', 'research', 'urgent']); // Sorted
    });
  });
});
