// ABOUTME: Unit tests for MongoDB connection singleton.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock objects that will be reused
const mockCollection = {
  createIndex: vi.fn().mockResolvedValue(undefined),
};
const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
};
const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  db: vi.fn().mockReturnValue(mockDb),
};

// Mock MongoDB client
vi.mock('mongodb', () => {
  return {
    MongoClient: vi.fn(function () {
      return mockClient;
    }),
    Db: vi.fn(),
  };
});

// Mock env config
vi.mock('./env', () => ({
  config: {
    database: {
      uri: 'mongodb://test:27017',
      dbName: 'test-db',
    },
  },
}));

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up cached connection
    const { closeDatabase } = await import('./database');
    await closeDatabase();
  });

  it('returns database instance', async () => {
    const { getDatabase } = await import('./database');

    const db = await getDatabase();

    expect(db).toBeDefined();
  });

  it('reuses connection on subsequent calls', async () => {
    const { getDatabase } = await import('./database');
    const { MongoClient } = await import('mongodb');

    await getDatabase();
    await getDatabase();

    // MongoClient should only be instantiated once
    expect(MongoClient).toHaveBeenCalledTimes(1);
  });

  it('creates indexes on first connection', async () => {
    const { getDatabase } = await import('./database');

    const db = await getDatabase();
    const collection = db.collection('projects');

    expect(collection.createIndex).toHaveBeenCalledWith({ ownerId: 1 });
    expect(collection.createIndex).toHaveBeenCalledWith({ ownerId: 1, updatedAt: -1 });
    expect(collection.createIndex).toHaveBeenCalledWith({ _id: 1, ownerId: 1 });
  });

  it('closeDatabase clears cache', async () => {
    const { getDatabase, closeDatabase, getClient } = await import('./database');

    await getDatabase();
    expect(getClient()).not.toBeNull();

    await closeDatabase();
    expect(getClient()).toBeNull();
  });
});
