// ABOUTME: Tests for MongoDBPresentationOverrideRepository.
// ABOUTME: Verifies save/load/delete operations and multi-tenant isolation (ownerId filter).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBPresentationOverrideRepository } from '../MongoDBPresentationOverrideRepository';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';

const CHAPTER_ID = 'chapter-123';
const OWNER_ID = 'user-abc';
const OVERRIDES: PresentationOverrideLayer = [
  { nodeIndex: 0, props: { fontFamily: 'Georgia', fontSize: '13pt' } },
  { nodeIndex: 2, props: { textAlign: 'center' } },
];

describe('MongoDBPresentationOverrideRepository', () => {
  let repo: MongoDBPresentationOverrideRepository;
  let mockCollection: {
    createIndex: ReturnType<typeof vi.fn>;
    replaceOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCollection = {
      createIndex: vi.fn().mockResolvedValue(undefined),
      replaceOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      findOne: vi.fn().mockResolvedValue(null),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };
    mockDb = { collection: vi.fn(() => mockCollection) };
    repo = new MongoDBPresentationOverrideRepository(mockDb as unknown as import('mongodb').Db);
  });

  describe('save', () => {
    it('calls replaceOne with chapterId as _id filter and ownerId + overrides', async () => {
      await repo.save(CHAPTER_ID, OWNER_ID, OVERRIDES);

      expect(mockCollection.replaceOne).toHaveBeenCalledWith(
        { _id: CHAPTER_ID, ownerId: OWNER_ID },
        expect.objectContaining({ ownerId: OWNER_ID, overrides: OVERRIDES }),
        { upsert: true }
      );
    });

    it('uses upsert so saving creates the document when it does not exist', async () => {
      await repo.save(CHAPTER_ID, OWNER_ID, OVERRIDES);

      const [, , options] = mockCollection.replaceOne.mock.calls[0];
      expect(options.upsert).toBe(true);
    });
  });

  describe('load', () => {
    it('queries by chapterId AND ownerId — never by chapterId alone', async () => {
      mockCollection.findOne.mockResolvedValue({ _id: CHAPTER_ID, ownerId: OWNER_ID, overrides: OVERRIDES });

      await repo.load(CHAPTER_ID, OWNER_ID);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: CHAPTER_ID, ownerId: OWNER_ID });
    });

    it('returns the overrides when document exists', async () => {
      mockCollection.findOne.mockResolvedValue({ _id: CHAPTER_ID, ownerId: OWNER_ID, overrides: OVERRIDES });

      const result = await repo.load(CHAPTER_ID, OWNER_ID);
      expect(result).toEqual(OVERRIDES);
    });

    it('returns null when no document exists', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repo.load(CHAPTER_ID, OWNER_ID);
      expect(result).toBeNull();
    });

    it('returns null when document exists for different owner (isolation)', async () => {
      // The db-level filter already handles this — simulate by returning null for foreign owner
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repo.load(CHAPTER_ID, 'different-owner');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes by chapterId AND ownerId — never by chapterId alone', async () => {
      await repo.delete(CHAPTER_ID, OWNER_ID);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: CHAPTER_ID, ownerId: OWNER_ID });
    });

    it('does not throw when document does not exist', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(repo.delete(CHAPTER_ID, OWNER_ID)).resolves.not.toThrow();
    });
  });

  describe('ensureIndexes', () => {
    it('creates a compound index on _id and ownerId', async () => {
      await repo.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { _id: 1, ownerId: 1 },
        expect.objectContaining({ unique: true })
      );
    });
  });
});
