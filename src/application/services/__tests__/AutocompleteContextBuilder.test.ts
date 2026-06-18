// ABOUTME: Tests for AutocompleteContextBuilder (long-range completion context)
// ABOUTME: Canon facts only; no research documents or derived metadata in the hot path

import { describe, it, expect, vi } from 'vitest';
import { AutocompleteContextBuilder } from '../AutocompleteContextBuilder';

describe('AutocompleteContextBuilder', () => {
  const makeCanonFact = (
    entity: string,
    statement: string,
    validFromChapter: number,
    category: 1 | 2 | 3 | 4 | 5 = 1
  ) => ({
    getEntity: () => entity,
    getStatement: () => statement,
    getValidFromChapter: () => validFromChapter,
    getCategory: () => category,
  });

  it('returns empty context when no canon is requested', async () => {
    const builder = new AutocompleteContextBuilder();

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
    });

    expect(context).toBe('');
    expect(canonFactsCount).toBe(0);
  });

  it('injects the [CANON] section when opted in with entities and a chapter index', async () => {
    const canonRepo = {
      findForSelection: vi.fn().mockResolvedValue([makeCanonFact('Léa', 'est morte', 9)]),
    };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).toContain('[CANON]');
    expect(context).toContain('Léa : est morte (depuis ch.10)');
    expect(canonFactsCount).toBe(1);
    expect(canonRepo.findForSelection).toHaveBeenCalledWith('o', 'p', ['Léa'], 11);
  });

  it('omits [CANON] when no entities are detected', async () => {
    const canonRepo = { findForSelection: vi.fn().mockResolvedValue([]) };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: [],
      chapterIndex: 5,
    });

    expect(context).not.toContain('[CANON]');
    expect(canonRepo.findForSelection).not.toHaveBeenCalled();
  });

  it('does not inject canon by default (no includeCanon)', async () => {
    const canonRepo = {
      findForSelection: vi.fn().mockResolvedValue([makeCanonFact('Léa', 'est morte', 9)]),
    };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).not.toContain('[CANON]');
    expect(canonFactsCount).toBe(0);
    expect(canonRepo.findForSelection).not.toHaveBeenCalled();
  });

  it('degrades gracefully when canon selection throws', async () => {
    const canonRepo = {
      findForSelection: vi.fn().mockRejectedValue(new Error('db down')),
    };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).not.toContain('[CANON]');
    expect(canonFactsCount).toBe(0);
    // Completion still works: context is empty but the request proceeds normally.
    expect(context).toBe('');
  });

  it('injects at most 40 facts (cap raised from 20)', async () => {
    const facts = Array.from({ length: 50 }, (_, i) =>
      makeCanonFact(`P${i}`, `fait ${i}`, i % 10)
    );
    const canonRepo = { findForSelection: vi.fn().mockResolvedValue(facts) };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: ['P0'],
      chapterIndex: 10,
    });

    expect(canonFactsCount).toBe(40);
  });

  it('sorts facts by most recent chapter first', async () => {
    const facts = [
      makeCanonFact('A', 'vieux', 0),
      makeCanonFact('B', 'récent', 5),
      makeCanonFact('C', 'milieu', 2),
    ];
    const canonRepo = { findForSelection: vi.fn().mockResolvedValue(facts) };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: ['A', 'B', 'C'],
      chapterIndex: 10,
    });

    const lines = context.split('\n').filter((l) => l.startsWith('B') || l.startsWith('C') || l.startsWith('A'));
    expect(lines[0]).toContain('B');  // ch.5 first
    expect(lines[1]).toContain('C');  // ch.2 second
    expect(lines[2]).toContain('A');  // ch.0 last
  });

  it('prioritises categories 2-5 (knowledge/belief/relational) over category 1 (objective) within the same chapter', async () => {
    const facts = [
      makeCanonFact('P', 'fait objectif', 3, 1),
      makeCanonFact('P', 'sait que X est le traître', 3, 2),
      makeCanonFact('P', 'méfiance envers Q', 3, 5),
      makeCanonFact('P', 'croit à tort que Y est innocent', 3, 3),
    ];
    const canonRepo = { findForSelection: vi.fn().mockResolvedValue(facts) };
    const builder = new AutocompleteContextBuilder(canonRepo as never);

    const { context } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      includeCanon: true,
      entities: ['P'],
      chapterIndex: 10,
    });

    const lines = context.split('\n').filter((l) => l.startsWith('P'));
    // Categories 2, 3, 5 come before category 1
    const first3 = [lines[0], lines[1], lines[2]];
    expect(first3.some((l) => l.includes('sait que X est le traître'))).toBe(true);
    expect(first3.some((l) => l.includes('croit à tort que Y est innocent'))).toBe(true);
    expect(first3.some((l) => l.includes('méfiance envers Q'))).toBe(true);
    expect(lines[3]).toContain('fait objectif');
  });
});
