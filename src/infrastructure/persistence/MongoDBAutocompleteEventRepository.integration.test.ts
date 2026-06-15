// ABOUTME: Integration tests for MongoDBAutocompleteEventRepository against a real MongoDB
// ABOUTME: Verifies persistence, stats, post-insertion deletion patch, and owner isolation — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBAutocompleteEventRepository } from './MongoDBAutocompleteEventRepository';
import { AutocompleteEvent } from '@/domain/entities/AutocompleteEvent';
import type { CreateAutocompleteEventProps } from '@/domain/entities/AutocompleteEvent';

const COLLECTION = 'autocompleteEvents';

function buildEvent(
  ownerId: string,
  overrides: Partial<CreateAutocompleteEventProps> = {}
): AutocompleteEvent {
  return AutocompleteEvent.create({
    id: new ObjectId().toHexString(),
    ownerId,
    projectId: 'project-1',
    chapterId: 'chapter-1',
    suggestionId: randomUUID(),
    providerType: 'anthropic',
    model: 'claude-sonnet-4-5',
    triggeredAt: new Date(),
    firstTokenMs: 200,
    totalMs: 800,
    suggestionLengthChars: 30,
    suggestionLengthWords: 6,
    acceptedChars: 30,
    acceptedWords: 6,
    outcome: 'accepted_full',
    deletedAfterMs: null,
    ...overrides,
  });
}

describe('MongoDBAutocompleteEventRepository — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let repository: MongoDBAutocompleteEventRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    repository = new MongoDBAutocompleteEventRepository(db);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
  });

  it('saves an event and aggregates stats by outcome', async () => {
    await repository.save(buildEvent(ownerId, { outcome: 'accepted_full', firstTokenMs: 100, totalMs: 500 }));
    await repository.save(buildEvent(ownerId, { outcome: 'rejected_escape', firstTokenMs: 300, totalMs: 900 }));
    await repository.save(
      buildEvent(ownerId, { outcome: 'empty', firstTokenMs: null, totalMs: 400, suggestionLengthChars: 0, suggestionLengthWords: 0 })
    );

    const stats = await repository.getStatsByProject(ownerId, 'project-1');

    expect(stats.total).toBe(3);
    expect(stats.byOutcome.accepted_full).toBe(1);
    expect(stats.byOutcome.rejected_escape).toBe(1);
    expect(stats.byOutcome.empty).toBe(1);
    expect(stats.acceptanceRate).toBeCloseTo(1 / 3);
    // firstTokenMs values present: 100, 300 (empty excluded) → p50 = 200
    expect(stats.firstTokenMsP50).toBeCloseTo(200);
  });

  it('computes the partial-acceptance rate', async () => {
    await repository.save(buildEvent(ownerId, { outcome: 'accepted_full' }));
    await repository.save(
      buildEvent(ownerId, { outcome: 'accepted_partial', acceptedChars: 12, acceptedWords: 2 })
    );

    const stats = await repository.getStatsByProject(ownerId, 'project-1');
    expect(stats.byOutcome.accepted_partial).toBe(1);
    expect(stats.partialAcceptanceRate).toBeCloseTo(0.5);
  });

  it('patches an accepted suggestion as deleted after insertion and reflects it in the rate', async () => {
    const event = buildEvent(ownerId, { outcome: 'accepted_full' });
    await repository.save(event);

    await repository.markDeletedAfterInsert(ownerId, event.getSuggestionId(), 4200);

    const stats = await repository.getStatsByProject(ownerId, 'project-1');
    expect(stats.postInsertionDeletionRate).toBe(1);
  });

  it('isolates events by ownerId', async () => {
    await repository.save(buildEvent(ownerId));
    const otherOwner = `other-${randomUUID()}`;
    await repository.save(buildEvent(otherOwner));

    const stats = await repository.getStatsByProject(ownerId, 'project-1');
    expect(stats.total).toBe(1);

    await db.collection(COLLECTION).deleteMany({ ownerId: otherOwner });
  });

  it('deletes all events for an owner (RGPD)', async () => {
    await repository.save(buildEvent(ownerId));
    await repository.deleteAllByOwner(ownerId);

    const stats = await repository.getStatsByProject(ownerId, 'project-1');
    expect(stats.total).toBe(0);
  });

  it('creates the expected indexes', async () => {
    const indexes = await db.collection(COLLECTION).indexes();
    const hasOwnerSuggestionUnique = indexes.some(
      (idx) => idx.key?.ownerId === 1 && idx.key?.suggestionId === 1 && idx.unique === true
    );
    expect(hasOwnerSuggestionUnique).toBe(true);
  });
});
