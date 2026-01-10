import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoDBMetadataRepository } from '../MongoDBMetadataRepository';
import { ProjectMetadata } from '@/domain';
import type { Db } from 'mongodb';

// Mock MongoDB
const mockCollection = {
  createIndex: vi.fn(),
  insertOne: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnValue({
      toArray: vi.fn(),
    }),
  }),
  replaceOne: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
};

describe('MongoDBMetadataRepository', () => {
  let repository: MongoDBMetadataRepository;

  const validContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongoDBMetadataRepository(mockDb as unknown as Db);
  });

  describe('ensureIndexes', () => {
    it('should create required indexes', async () => {
      mockCollection.createIndex.mockResolvedValue('index-name');

      await repository.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledTimes(3);

      // Check projectId_ownerId index
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { projectId: 1, ownerId: 1 },
        { name: 'projectId_ownerId' }
      );

      // Check unique projectId_typeKey_ownerId index
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { projectId: 1, typeKey: 1, ownerId: 1 },
        { name: 'projectId_typeKey_ownerId', unique: true }
      );

      // Check id_ownerId index
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { _id: 1, ownerId: 1 },
        { name: 'id_ownerId' }
      );
    });
  });

  describe('create', () => {
    it('should insert metadata document', async () => {
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'meta-1' });

      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Analyse Narrative'
      );

      const result = await repository.create('user-1', metadata);

      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(result.getId()).toBe('meta-1');
    });

    it('should throw on duplicate type', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('duplicate key'));

      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title'
      );

      await expect(repository.create('user-1', metadata))
        .rejects.toThrow('already exists');
    });
  });

  describe('findById', () => {
    it('should return metadata when found', async () => {
      mockCollection.findOne.mockResolvedValue({
        _id: 'meta-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        typeKey: 'narrative-analysis',
        title: 'Title',
        content: validContent,
        properties: {
          wordCount: 0,
          characterCount: 0,
          lastEdited: new Date(),
          generatedAt: null,
          isGenerated: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.findById('user-1', 'meta-1');

      expect(result).not.toBeNull();
      expect(result?.getId()).toBe('meta-1');
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: 'meta-1',
        ownerId: 'user-1',
      });
    });

    it('should return null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById('user-1', 'meta-1');

      expect(result).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should return all metadata for project', async () => {
      const metadata1 = {
        _id: 'meta-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        typeKey: 'narrative-analysis',
        title: 'Title 1',
        content: validContent,
        properties: {
          wordCount: 0,
          characterCount: 0,
          lastEdited: new Date(),
          generatedAt: null,
          isGenerated: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const metadata2 = {
        _id: 'meta-2',
        projectId: 'project-1',
        ownerId: 'user-1',
        typeKey: 'narrative-analysis',
        title: 'Title 2',
        content: validContent,
        properties: {
          wordCount: 0,
          characterCount: 0,
          lastEdited: new Date(),
          generatedAt: null,
          isGenerated: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([metadata1, metadata2]),
        }),
      });

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).toHaveLength(2);
      expect(result[0].getId()).toBe('meta-1');
      expect(result[1].getId()).toBe('meta-2');
      expect(mockCollection.find).toHaveBeenCalledWith({
        projectId: 'project-1',
        ownerId: 'user-1',
      });
    });

    it('should return empty array when no metadata exists', async () => {
      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).toEqual([]);
    });
  });

  describe('findByProjectAndType', () => {
    it('should filter by project and type', async () => {
      mockCollection.findOne.mockResolvedValue({
        _id: 'meta-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        typeKey: 'narrative-analysis',
        title: 'Title',
        content: validContent,
        properties: {
          wordCount: 0,
          characterCount: 0,
          lastEdited: new Date(),
          generatedAt: null,
          isGenerated: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.findByProjectAndType('user-1', 'project-1', 'narrative-analysis');

      expect(result).not.toBeNull();
      expect(result?.getTypeKey()).toBe('narrative-analysis');
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        projectId: 'project-1',
        typeKey: 'narrative-analysis',
        ownerId: 'user-1',
      });
    });

    it('should return null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByProjectAndType('user-1', 'project-1', 'narrative-analysis');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update metadata document', async () => {
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });

      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Updated Title'
      );

      const result = await repository.update('user-1', metadata);

      expect(result.getId()).toBe('meta-1');
      expect(mockCollection.replaceOne).toHaveBeenCalledWith(
        { _id: 'meta-1', ownerId: 'user-1' },
        expect.objectContaining({
          _id: 'meta-1',
          projectId: 'project-1',
          ownerId: 'user-1',
        })
      );
    });

    it('should throw when metadata not found', async () => {
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 0 });

      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title'
      );

      await expect(repository.update('user-1', metadata))
        .rejects.toThrow('not found or not owned');
    });
  });

  describe('delete', () => {
    it('should delete metadata document', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await repository.delete('user-1', 'meta-1');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: 'meta-1',
        ownerId: 'user-1',
      });
    });

    it('should throw when metadata not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(repository.delete('user-1', 'meta-1'))
        .rejects.toThrow('not found or not owned');
    });
  });

  describe('deleteByProjectId', () => {
    it('should delete all metadata for project', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await repository.deleteByProjectId('user-1', 'project-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        projectId: 'project-1',
        ownerId: 'user-1',
      });
    });

    it('should complete successfully even if no metadata exists', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await expect(repository.deleteByProjectId('user-1', 'project-1'))
        .resolves.not.toThrow();
    });
  });
});
