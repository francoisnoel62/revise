// ABOUTME: Tests for MongoDBExchangeRepository
// ABOUTME: Verifies ownerId isolation, metadata-only list, encrypted detail fetch, and TTL index

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { MongoDBExchangeRepository } from '../MongoDBExchangeRepository';
import { AIExchange } from '@/domain/entities/AIExchange';
import { FieldEncryption } from '@/infrastructure/security/FieldEncryption';
import { serializeAIExchange } from '../ai-exchange-serializer';

const encryption = new FieldEncryption('0'.repeat(64));

function buildExchange(id: string) {
  return AIExchange.create({
    id,
    userId: 'user-1',
    projectId: 'project-1',
    usageRecordId: 'usage-1',
    operation: 'rewrite',
    provider: 'Anthropic',
    model: 'claude-sonnet',
    systemPrompt: 's',
    input: 'secret input',
    output: 'secret output',
    retentionDays: 30,
  });
}

describe('MongoDBExchangeRepository', () => {
  let mockCursor: {
    sort: ReturnType<typeof vi.fn>;
    skip: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    toArray: ReturnType<typeof vi.fn>;
  };
  let mockCollection: {
    insertOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    distinct: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockDb: { collection: ReturnType<typeof vi.fn> };
  let repository: MongoDBExchangeRepository;

  beforeEach(() => {
    mockCursor = {
      sort: vi.fn(() => mockCursor),
      skip: vi.fn(() => mockCursor),
      limit: vi.fn(() => mockCursor),
      toArray: vi.fn(async () => []),
    };
    mockCollection = {
      insertOne: vi.fn(async () => ({ insertedId: new ObjectId() })),
      find: vi.fn(() => mockCursor),
      findOne: vi.fn(async () => null),
      deleteMany: vi.fn(async () => ({ deletedCount: 0 })),
      distinct: vi.fn(async () => []),
      createIndex: vi.fn(async () => 'idx'),
    };
    mockDb = { collection: vi.fn(() => mockCollection) };
    repository = new MongoDBExchangeRepository(
      mockDb as unknown as import('mongodb').Db,
      encryption
    );
  });

  it('encrypts content on save', async () => {
    await repository.save(buildExchange(new ObjectId().toHexString()));

    const doc = mockCollection.insertOne.mock.calls[0][0];
    expect(doc.input).not.toContain('secret');
    expect(doc.output).not.toContain('secret');
  });

  it('scopes list queries to the owner and returns content-free summaries', async () => {
    const doc = serializeAIExchange(
      buildExchange(new ObjectId().toHexString()),
      encryption
    );
    mockCursor.toArray.mockResolvedValue([doc]);

    const results = await repository.findByOwner('user-1', {
      operation: 'rewrite',
    });

    expect(mockCollection.find).toHaveBeenCalledWith({
      userId: 'user-1',
      operation: 'rewrite',
    });
    expect(results[0]).not.toHaveProperty('input');
    expect(results[0].operation).toBe('rewrite');
  });

  it('decrypts content only when fetching a single owned exchange', async () => {
    const id = new ObjectId();
    const doc = serializeAIExchange(buildExchange(id.toHexString()), encryption);
    mockCollection.findOne.mockResolvedValue(doc);

    const result = await repository.findById('user-1', id.toHexString());

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      userId: 'user-1',
    });
    expect(result?.getInput()).toBe('secret input');
  });

  it('returns null for an invalid id without querying', async () => {
    const result = await repository.findById('user-1', 'not-an-objectid');

    expect(result).toBeNull();
    expect(mockCollection.findOne).not.toHaveBeenCalled();
  });

  it('returns distinct sorted models scoped to the owner', async () => {
    mockCollection.distinct.mockResolvedValue(['gpt-4o', 'claude-sonnet']);

    const models = await repository.distinctModels('user-1');

    expect(mockCollection.distinct).toHaveBeenCalledWith('model', {
      userId: 'user-1',
    });
    expect(models).toEqual(['claude-sonnet', 'gpt-4o']);
  });

  it('deletes all exchanges for an owner', async () => {
    await repository.deleteAllByOwner('user-1');
    expect(mockCollection.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('creates a TTL index on expiresAt', async () => {
    await repository.ensureIndexes();
    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
  });
});
