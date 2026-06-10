// ABOUTME: Tests for MongoDB persistence of model pricing entries
// ABOUTME: Covers upsert, findAll, findByProvider, update, delete

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoDBModelPricingRepository } from '../MongoDBModelPricingRepository';
import { ModelPricingEntry, PricingProvider } from '@/domain/interfaces/ModelPricingRepository';

const makeEntry = (overrides: Partial<ModelPricingEntry> = {}): ModelPricingEntry => ({
  id: 'some-id',
  provider: 'anthropic',
  prefix: 'claude-opus-4',
  inputPerM: 5.0,
  outputPerM: 25.0,
  cachedInputPerM: 0.5,
  cachedInInput: false,
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

function makeMocks() {
  const mockCollection = {
    bulkWrite: vi.fn().mockResolvedValue({}),
    find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    findOne: vi.fn().mockResolvedValue(null),
    findOneAndUpdate: vi.fn().mockResolvedValue(null),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return { mockDb, mockCollection };
}

describe('MongoDBModelPricingRepository', () => {
  let repo: MongoDBModelPricingRepository;
  let mockCollection: ReturnType<typeof makeMocks>['mockCollection'];
  let mockDb: ReturnType<typeof makeMocks>['mockDb'];

  beforeEach(() => {
    ({ mockDb, mockCollection } = makeMocks());
    repo = new MongoDBModelPricingRepository(mockDb as never);
  });

  it('upsertMany calls bulkWrite with one op per entry', async () => {
    const entry = makeEntry();
    await repo.upsertMany([{ provider: entry.provider, prefix: entry.prefix, inputPerM: entry.inputPerM, outputPerM: entry.outputPerM, cachedInputPerM: entry.cachedInputPerM, cachedInInput: entry.cachedInInput, updatedAt: entry.updatedAt }]);

    expect(mockCollection.bulkWrite).toHaveBeenCalledOnce();
    const ops = mockCollection.bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(1);
    expect(ops[0].updateOne.filter).toEqual({ provider: 'anthropic', prefix: 'claude-opus-4' });
    expect(ops[0].updateOne.upsert).toBe(true);
  });

  it('findAll returns deserialized entries', async () => {
    const doc = {
      _id: { toString: () => 'abc123' },
      provider: 'anthropic' as PricingProvider,
      prefix: 'claude-opus-4',
      inputPerM: 5.0,
      outputPerM: 25.0,
      cachedInputPerM: 0.5,
      cachedInInput: false,
      updatedAt: new Date('2026-01-01'),
    };
    mockCollection.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([doc]) });

    const results = await repo.findAll();

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('abc123');
    expect(results[0].provider).toBe('anthropic');
  });

  it('findByProvider filters by provider', async () => {
    mockCollection.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

    await repo.findByProvider('openai');

    expect(mockCollection.find).toHaveBeenCalledWith({ provider: 'openai' });
  });

  it('update calls findOneAndUpdate and returns updated entry', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const doc = {
      _id: { toString: () => validId },
      provider: 'anthropic' as PricingProvider,
      prefix: 'claude-opus-4',
      inputPerM: 6.0,
      outputPerM: 25.0,
      cachedInputPerM: 0.5,
      cachedInInput: false,
      updatedAt: new Date(),
    };
    mockCollection.findOneAndUpdate.mockResolvedValue(doc);

    const result = await repo.update(validId, { inputPerM: 6.0 });

    expect(result).not.toBeNull();
    expect(result!.inputPerM).toBe(6.0);
  });

  it('delete calls deleteOne with the id', async () => {
    await repo.delete('507f1f77bcf86cd799439011');
    expect(mockCollection.deleteOne).toHaveBeenCalledOnce();
  });
});
