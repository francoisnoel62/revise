// ABOUTME: Tests for the CanonFact entity (atomic manuscript fact with temporal validity)
// ABOUTME: Covers validation rules, temporal bounds, source provenance and reconstruction

import { describe, it, expect } from 'vitest';
import { CanonFact, type CanonFactProperties } from '../CanonFact';

function validProps(overrides: Partial<CanonFactProperties> = {}): CanonFactProperties {
  return {
    id: 'fact-1',
    ownerId: 'owner-1',
    projectId: 'project-1',
    entity: 'Léa',
    statement: 'est morte',
    validFromChapter: 9,
    validToChapter: null,
    source: 'derived',
    sourceChapterId: 'chapter-10',
    contentHash: 'abc123',
    createdAt: new Date('2026-06-15T10:00:00Z'),
    updatedAt: new Date('2026-06-15T10:00:00Z'),
    ...overrides,
  };
}

describe('CanonFact', () => {
  it('creates a fact and stamps createdAt/updatedAt', () => {
    const fact = CanonFact.create({
      id: 'fact-1',
      ownerId: 'owner-1',
      projectId: 'project-1',
      entity: 'Léa',
      statement: 'est morte',
      validFromChapter: 9,
      validToChapter: null,
      source: 'author',
      sourceChapterId: null,
      contentHash: null,
    });
    expect(fact.getEntity()).toBe('Léa');
    expect(fact.getSource()).toBe('author');
    expect(fact.getCreatedAt()).toBeInstanceOf(Date);
    expect(fact.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it('reconstructs from full properties with getters', () => {
    const fact = CanonFact.reconstruct(validProps());
    expect(fact.getId()).toBe('fact-1');
    expect(fact.getOwnerId()).toBe('owner-1');
    expect(fact.getProjectId()).toBe('project-1');
    expect(fact.getStatement()).toBe('est morte');
    expect(fact.getValidFromChapter()).toBe(9);
    expect(fact.getValidToChapter()).toBeNull();
    expect(fact.getSourceChapterId()).toBe('chapter-10');
    expect(fact.getContentHash()).toBe('abc123');
  });

  it('rejects empty entity or statement', () => {
    expect(() => CanonFact.reconstruct(validProps({ entity: '  ' }))).toThrow();
    expect(() => CanonFact.reconstruct(validProps({ statement: '' }))).toThrow();
  });

  it('rejects negative or non-integer validFromChapter', () => {
    expect(() => CanonFact.reconstruct(validProps({ validFromChapter: -1 }))).toThrow();
    expect(() => CanonFact.reconstruct(validProps({ validFromChapter: 2.5 }))).toThrow();
  });

  it('rejects validToChapter before validFromChapter', () => {
    expect(() =>
      CanonFact.reconstruct(validProps({ validFromChapter: 5, validToChapter: 3 }))
    ).toThrow();
  });

  it('accepts validToChapter equal to or after validFromChapter', () => {
    expect(() =>
      CanonFact.reconstruct(validProps({ validFromChapter: 5, validToChapter: 5 }))
    ).not.toThrow();
    expect(() =>
      CanonFact.reconstruct(validProps({ validFromChapter: 5, validToChapter: 8 }))
    ).not.toThrow();
  });

  it('rejects an invalid source', () => {
    expect(() =>
      CanonFact.reconstruct(validProps({ source: 'robot' as unknown as 'derived' }))
    ).toThrow();
  });
});
