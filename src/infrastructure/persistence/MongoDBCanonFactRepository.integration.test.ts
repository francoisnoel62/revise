// ABOUTME: Integration tests for MongoDBCanonFactRepository against a real MongoDB
// ABOUTME: Verifies temporal selection, derived/author reconciliation, owner isolation — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBCanonFactRepository } from './MongoDBCanonFactRepository';
import { CanonFact } from '@/domain/entities/CanonFact';
import type { CreateCanonFactProps } from '@/domain/entities/CanonFact';

const COLLECTION = 'canonFacts';

function buildFact(
  ownerId: string,
  overrides: Partial<CreateCanonFactProps> = {}
): CanonFact {
  return CanonFact.create({
    id: new ObjectId().toHexString(),
    ownerId,
    projectId: 'project-1',
    entity: 'Léa',
    statement: 'est morte',
    validFromChapter: 9,
    validToChapter: null,
    source: 'derived',
    sourceChapterId: 'chapter-10',
    contentHash: 'hash-1',
    ...overrides,
  });
}

describe('MongoDBCanonFactRepository — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let repository: MongoDBCanonFactRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    repository = new MongoDBCanonFactRepository(db);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
  });

  it('saves a fact and lists it back', async () => {
    await repository.save(buildFact(ownerId));
    const facts = await repository.listByProject(ownerId, 'project-1');
    expect(facts).toHaveLength(1);
    expect(facts[0].getEntity()).toBe('Léa');
    expect(facts[0].getStatement()).toBe('est morte');
  });

  it('findForSelection respects entity membership and temporal validity', async () => {
    await repository.save(buildFact(ownerId, { entity: 'Léa', validFromChapter: 9, validToChapter: null }));
    await repository.save(buildFact(ownerId, { entity: 'Tom', validFromChapter: 0, validToChapter: null, statement: 'a peur de l’eau' }));
    await repository.save(buildFact(ownerId, { entity: 'Léa', validFromChapter: 2, validToChapter: 4, statement: 'est blessée' }));

    // At chapter 11: Léa "est morte" (from 9) applies; "est blessée" (2..4) does not.
    const atCh11 = await repository.findForSelection(ownerId, 'project-1', ['Léa'], 11);
    expect(atCh11.map((f) => f.getStatement())).toEqual(['est morte']);

    // Tom not requested → excluded even if valid.
    const tomOnly = await repository.findForSelection(ownerId, 'project-1', ['Tom'], 11);
    expect(tomOnly.map((f) => f.getStatement())).toEqual(['a peur de l’eau']);

    // Before chapter 9 → "est morte" not yet valid.
    const atCh3 = await repository.findForSelection(ownerId, 'project-1', ['Léa'], 3);
    expect(atCh3.map((f) => f.getStatement())).toEqual(['est blessée']);

    // Empty entities → empty result.
    expect(await repository.findForSelection(ownerId, 'project-1', [], 11)).toEqual([]);
  });

  it('replaceDerived replaces derived facts but preserves author facts', async () => {
    await repository.save(buildFact(ownerId, { source: 'derived', statement: 'ancien fait dérivé' }));
    await repository.save(
      buildFact(ownerId, { source: 'author', statement: 'fait écrit par l’auteur', contentHash: null })
    );

    await repository.replaceDerived(ownerId, 'project-1', [
      buildFact(ownerId, { source: 'derived', statement: 'nouveau fait dérivé' }),
    ]);

    const facts = await repository.listByProject(ownerId, 'project-1');
    const statements = facts.map((f) => f.getStatement()).sort();
    expect(statements).toEqual(['fait écrit par l’auteur', 'nouveau fait dérivé']);
  });

  it('isolates facts by ownerId', async () => {
    const otherOwner = `test-integration-${randomUUID()}`;
    await repository.save(buildFact(ownerId));
    await repository.save(buildFact(otherOwner));

    const mine = await repository.listByProject(ownerId, 'project-1');
    expect(mine).toHaveLength(1);
    expect(mine[0].getOwnerId()).toBe(ownerId);

    await db.collection(COLLECTION).deleteMany({ ownerId: otherOwner });
  });

  it('deleteAllByOwner removes every fact of the owner', async () => {
    await repository.save(buildFact(ownerId, { entity: 'Léa' }));
    await repository.save(buildFact(ownerId, { entity: 'Tom' }));
    await repository.deleteAllByOwner(ownerId);
    expect(await repository.listByProject(ownerId, 'project-1')).toEqual([]);
  });

  it('update modifies an existing author fact', async () => {
    const fact = buildFact(ownerId, { source: 'author', statement: 'avant', contentHash: null });
    await repository.save(fact);
    const updated = CanonFact.reconstruct({
      id: fact.getId(),
      ownerId,
      projectId: 'project-1',
      entity: 'Léa',
      statement: 'après',
      validFromChapter: 9,
      validToChapter: null,
      source: 'author',
      sourceChapterId: null,
      contentHash: null,
      createdAt: fact.getCreatedAt(),
      updatedAt: new Date(),
    });
    await repository.update(ownerId, updated);

    const facts = await repository.listByProject(ownerId, 'project-1');
    expect(facts).toHaveLength(1);
    expect(facts[0].getStatement()).toBe('après');
  });
});
