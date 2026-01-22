// ABOUTME: Tests for MongoDBProjectSettingsRepository
// ABOUTME: Verifies CRUD operations and multi-tenant isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBProjectSettingsRepository } from '../MongoDBProjectSettingsRepository';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { DuplicateProjectSettingsError } from '@/domain/interfaces/ProjectSettingsRepository';
import { ObjectId } from 'mongodb';

describe('MongoDBProjectSettingsRepository', () => {
  let repository: MongoDBProjectSettingsRepository;
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      insertOne: vi.fn(),
      findOne: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
      createIndex: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    repository = new MongoDBProjectSettingsRepository(mockDb as unknown as import('mongodb').Db);
  });

  describe('create', () => {
    it('creates settings successfully', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      mockCollection.insertOne.mockResolvedValue({ insertedId: settings.getId() });

      const result = await repository.create('user-1', settings);

      expect(result.getId()).toBe(settings.getId());
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('throws error when owner does not match', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      await expect(repository.create('user-2', settings)).rejects.toThrow(
        'Settings owner does not match user'
      );
    });

    it('throws DuplicateProjectSettingsError on duplicate key', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      const duplicateError = { code: 11000, message: 'duplicate key error' };
      mockCollection.insertOne.mockRejectedValue(duplicateError);

      await expect(repository.create('user-1', settings)).rejects.toThrow(
        DuplicateProjectSettingsError
      );
    });
  });

  describe('findById', () => {
    it('returns settings when found', async () => {
      const settingsId = new ObjectId();
      const mockDoc = {
        _id: settingsId,
        projectId: 'project-1',
        ownerId: 'user-1',
        title: 'My Novel',
        subtitle: undefined,
        summary: '',
        coverImageUrl: undefined,
        genre: '',
        synopsis: '',
        pointOfView: undefined,
        tense: undefined,
        targetAudience: undefined,
        isbn: undefined,
        contributors: [],
        relatedWorks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findById('user-1', settingsId.toHexString());

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe('My Novel');
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
    it('returns settings when found', async () => {
      const settingsId = new ObjectId();
      const mockDoc = {
        _id: settingsId,
        projectId: 'project-1',
        ownerId: 'user-1',
        title: 'My Novel',
        subtitle: 'A Subtitle',
        summary: 'Summary text',
        coverImageUrl: 'https://example.com/cover.jpg',
        genre: 'Fantasy',
        synopsis: 'Synopsis text',
        pointOfView: 'first_person',
        tense: 'past',
        targetAudience: 'adult',
        isbn: '978-0-13-468599-1',
        contributors: [{ name: 'John', role: 'author' }],
        relatedWorks: [{ title: 'Book 1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe('My Novel');
      expect(result?.getSubtitle()).toBe('A Subtitle');
      expect(result?.getGenre()).toBe('Fantasy');
      expect(result?.getPointOfView()).toBe('first_person');
    });

    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByProjectId('user-1', 'project-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates settings successfully', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await repository.update('user-1', settings);

      expect(result.getId()).toBe(settings.getId());
    });

    it('throws error when settings not found', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      await expect(repository.update('user-1', settings)).rejects.toThrow(
        'Settings not found or access denied'
      );
    });

    it('throws error when owner does not match', async () => {
      const settings = ProjectSettings.create(
        new ObjectId().toHexString(),
        'project-1',
        'user-1',
        'My Novel'
      );

      await expect(repository.update('user-2', settings)).rejects.toThrow(
        'Settings owner does not match user'
      );
    });
  });

  describe('delete', () => {
    it('deletes settings successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).resolves.not.toThrow();
    });

    it('throws error when settings not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(
        repository.delete('user-1', new ObjectId().toHexString())
      ).rejects.toThrow('Settings not found or access denied');
    });

    it('throws error for invalid settings ID', async () => {
      await expect(repository.delete('user-1', 'invalid-id')).rejects.toThrow(
        'Invalid settings ID'
      );
    });
  });

  describe('deleteByProjectId', () => {
    it('deletes settings for project', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await repository.deleteByProjectId('user-1', 'project-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        projectId: 'project-1',
        ownerId: 'user-1',
      });
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all settings for owner', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 10 });

      await repository.deleteAllByOwner('user-1');

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        ownerId: 'user-1',
      });
    });
  });

  describe('ensureIndexes', () => {
    it('creates indexes', async () => {
      mockCollection.createIndex.mockResolvedValue('index_name');

      await repository.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledWith({ ownerId: 1, projectId: 1 }, { unique: true });
    });
  });
});
