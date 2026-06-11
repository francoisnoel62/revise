// ABOUTME: Integration tests for MongoDBExchangeRepository against a real MongoDB
// ABOUTME: Verifies at-rest encryption, the TTL index, and list/detail/owner isolation — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBExchangeRepository } from './MongoDBExchangeRepository';
import { FieldEncryption } from '@/infrastructure/security/FieldEncryption';
import { AIExchange } from '@/domain/entities/AIExchange';

const COLLECTION = 'aiExchanges';
const encryption = new FieldEncryption('0'.repeat(64));

function buildExchange(userId: string, overrides: Partial<{ model: string }> = {}) {
  return AIExchange.create({
    id: new ObjectId().toHexString(),
    userId,
    projectId: 'project-1',
    usageRecordId: new ObjectId().toHexString(),
    operation: 'rewrite',
    provider: 'Anthropic',
    model: overrides.model ?? 'claude-sonnet-4-5',
    systemPrompt: 'Tu es un assistant littéraire.',
    input: 'Texte sensible de l’auteur à réécrire.',
    output: 'Réponse brute de l’IA.',
    inputTokens: 1500,
    outputTokens: 420,
    costEur: 0.02,
    durationMs: 2500,
    retentionDays: 30,
  });
}

describe('MongoDBExchangeRepository — intégration MongoDB réel', () => {
  let db: Db;
  let userId: string;
  let repository: MongoDBExchangeRepository;

  beforeEach(async () => {
    db = await getDatabase();
    userId = `test-integration-${randomUUID()}`;
    repository = new MongoDBExchangeRepository(db, encryption);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ userId });
  });

  it('stores content encrypted at rest and decrypts it on findById', async () => {
    const exchange = buildExchange(userId);
    await repository.save(exchange);

    // Raw document: content fields must be unreadable ciphertext.
    const raw = await db
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(exchange.getId()) });
    expect(raw).not.toBeNull();
    expect(raw?.input).not.toContain('sensible');
    expect(raw?.output).not.toContain('Réponse');
    expect(raw?.systemPrompt).not.toContain('assistant');
    // base64(iv):base64(tag):base64(ciphertext)
    expect(String(raw?.input).split(':')).toHaveLength(3);

    // findById decrypts back to plaintext.
    const found = await repository.findById(userId, exchange.getId());
    expect(found?.getInput()).toBe('Texte sensible de l’auteur à réécrire.');
    expect(found?.getOutput()).toBe('Réponse brute de l’IA.');
    expect(found?.getCostEur()).toBe(0.02);
  });

  it('returns metadata-only summaries scoped to the owner', async () => {
    await repository.save(buildExchange(userId));
    await repository.save(buildExchange(`other-${randomUUID()}`));

    const summaries = await repository.findByOwner(userId);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).not.toHaveProperty('input');
    expect(summaries[0]).not.toHaveProperty('output');
    expect(summaries[0].operation).toBe('rewrite');
    expect(summaries[0].costEur).toBe(0.02);
  });

  it('lists the distinct models used by the owner', async () => {
    await repository.save(buildExchange(userId, { model: 'gpt-4o' }));
    await repository.save(buildExchange(userId, { model: 'claude-sonnet-4-5' }));

    const models = await repository.distinctModels(userId);

    expect(models).toEqual(['claude-sonnet-4-5', 'gpt-4o']);
  });

  it('configures a TTL index on expiresAt for automatic purge', async () => {
    const indexes = await db.collection(COLLECTION).indexes();
    const ttlIndex = indexes.find(
      (idx) => idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
    );
    expect(ttlIndex).toBeDefined();
  });

  it('deletes all exchanges for an owner', async () => {
    await repository.save(buildExchange(userId));
    await repository.deleteAllByOwner(userId);

    const summaries = await repository.findByOwner(userId);
    expect(summaries).toHaveLength(0);
  });
});
