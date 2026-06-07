// ABOUTME: Tests for MongoDBCharacterConversationRepository
// ABOUTME: Verifies CRUD, multi-tenant isolation, and bulk deletion

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Db, ObjectId } from 'mongodb';
import { MongoDBCharacterConversationRepository } from '../MongoDBCharacterConversationRepository';
import { CharacterConversation } from '@/domain/entities/CharacterConversation';

const makeDoc = (overrides = {}) => ({
  _id: new ObjectId(),
  ownerId: 'user-1',
  projectId: 'proj-1',
  characterId: 'char-1',
  messages: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
});

const makeConversation = (userId = 'user-1') =>
  CharacterConversation.create(
    new ObjectId().toHexString(),
    userId,
    'proj-1',
    'char-1',
  );

describe('MongoDBCharacterConversationRepository', () => {
  let repository: MongoDBCharacterConversationRepository;
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    replaceOne: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      findOne: vi.fn().mockResolvedValue(null),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      replaceOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      createIndex: vi.fn().mockResolvedValue('ok'),
    };
    mockDb = { collection: vi.fn(() => mockCollection) };
    repository = new MongoDBCharacterConversationRepository(mockDb as unknown as Db);
  });

  describe('create', () => {
    it('inserts and returns the conversation', async () => {
      const conv = makeConversation();
      const result = await repository.create('user-1', conv);
      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(result.getId()).toBe(conv.getId());
    });

    it('throws on ownership mismatch', async () => {
      const conv = makeConversation('user-1');
      await expect(repository.create('user-2', conv)).rejects.toThrow('Ownership mismatch');
    });
  });

  describe('findById', () => {
    it('returns conversation when found', async () => {
      const id = new ObjectId();
      mockCollection.findOne.mockResolvedValue(makeDoc({ _id: id }));
      const result = await repository.findById('user-1', id.toHexString());
      expect(result).not.toBeNull();
      expect(result?.getId()).toBe(id.toHexString());
    });

    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const result = await repository.findById('user-1', new ObjectId().toHexString());
      expect(result).toBeNull();
    });

    it('returns null for invalid ObjectId (no throw)', async () => {
      const result = await repository.findById('user-1', 'not-valid-id');
      expect(result).toBeNull();
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByCharacterId', () => {
    it('returns array of conversations sorted by updatedAt desc', async () => {
      const docA = makeDoc({ _id: new ObjectId(), updatedAt: new Date('2024-01-01') });
      const docB = makeDoc({ _id: new ObjectId(), updatedAt: new Date('2024-01-02') });
      mockCollection.find.mockReturnValue({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([docB, docA]),
        })),
      });
      const results = await repository.findByCharacterId('user-1', 'char-1');
      expect(results).toHaveLength(2);
    });

    it('returns empty array when none found', async () => {
      const results = await repository.findByCharacterId('user-1', 'char-99');
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('replaces the document and returns the conversation', async () => {
      const conv = makeConversation();
      const result = await repository.update('user-1', conv);
      expect(mockCollection.replaceOne).toHaveBeenCalled();
      expect(result.getId()).toBe(conv.getId());
    });

    it('throws on ownership mismatch', async () => {
      const conv = makeConversation('user-1');
      await expect(repository.update('user-2', conv)).rejects.toThrow('Ownership mismatch');
    });

    it('throws when conversation not found', async () => {
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 0 });
      const conv = makeConversation();
      await expect(repository.update('user-1', conv)).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('deletes a conversation by id', async () => {
      await repository.delete('user-1', new ObjectId().toHexString());
      expect(mockCollection.deleteOne).toHaveBeenCalled();
    });

    it('throws when conversation not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(repository.delete('user-1', new ObjectId().toHexString())).rejects.toThrow('not found');
    });

    it('returns silently for invalid ObjectId', async () => {
      await expect(repository.delete('user-1', 'bad-id')).resolves.toBeUndefined();
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('deleteByCharacterId', () => {
    it('calls deleteMany with correct filter', async () => {
      await repository.deleteByCharacterId('user-1', 'char-1');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1', characterId: 'char-1' })
      );
    });
  });

  describe('deleteByProjectId', () => {
    it('calls deleteMany with correct filter', async () => {
      await repository.deleteByProjectId('user-1', 'proj-1');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1', projectId: 'proj-1' })
      );
    });
  });

  describe('deleteAllByOwner', () => {
    it('deletes all conversations for user', async () => {
      await repository.deleteAllByOwner('user-1');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ ownerId: 'user-1' });
    });
  });
});
