// ABOUTME: Tests for MongoDB persistence of pending (quarantined) model price changes
// ABOUTME: Covers upsert by key, findAll, deleteByKey, delete

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoDBPendingPriceChangeRepository } from '../MongoDBPendingPriceChangeRepository';
import { PendingPriceChange } from '@/domain/interfaces/PendingPriceChangeRepository';

const makeChange = (overrides: Partial<Omit<PendingPriceChange, 'id'>> = {}): Omit<PendingPriceChange, 'id'> => ({
  key: 'openai/gpt-4o',
  provider: 'openai',
  prefix: 'gpt-4o',
  modelPricingId: '507f1f77bcf86cd799439011',
  previous: { inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 0.25 },
  current: { inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 1.25 },
  detectedAt: new Date('2026-09-20'),
  ...overrides,
});

function makeMocks() {
  const mockCollection = {
    updateOne: vi.fn().mockResolvedValue({}),
    find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    createIndex: vi.fn().mockResolvedValue('key_1'),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return { mockDb, mockCollection };
}

describe('MongoDBPendingPriceChangeRepository', () => {
  let repo: MongoDBPendingPriceChangeRepository;
  let mockCollection: ReturnType<typeof makeMocks>['mockCollection'];
  let mockDb: ReturnType<typeof makeMocks>['mockDb'];

  beforeEach(() => {
    ({ mockDb, mockCollection } = makeMocks());
    repo = new MongoDBPendingPriceChangeRepository(mockDb as never);
  });

  it('upsert calls updateOne keyed by the provider/prefix key with upsert: true', async () => {
    const change = makeChange();

    await repo.upsert(change);

    expect(mockCollection.updateOne).toHaveBeenCalledOnce();
    const [filter, update, options] = mockCollection.updateOne.mock.calls[0];
    expect(filter).toEqual({ key: 'openai/gpt-4o' });
    expect(update.$set.current.cachedInputPerM).toBe(1.25);
    expect(options).toEqual({ upsert: true });
  });

  it('findAll returns deserialized pending changes', async () => {
    const doc = {
      _id: { toString: () => 'abc123' },
      ...makeChange(),
    };
    mockCollection.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([doc]) });

    const results = await repo.findAll();

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('abc123');
    expect(results[0].key).toBe('openai/gpt-4o');
    expect(results[0].modelPricingId).toBe('507f1f77bcf86cd799439011');
  });

  it('deleteByKey removes the entry matching that key', async () => {
    await repo.deleteByKey('openai/gpt-4o');

    expect(mockCollection.deleteOne).toHaveBeenCalledWith({ key: 'openai/gpt-4o' });
  });

  it('delete removes the entry by id', async () => {
    await repo.delete('507f1f77bcf86cd799439011');

    expect(mockCollection.deleteOne).toHaveBeenCalledOnce();
  });
});
