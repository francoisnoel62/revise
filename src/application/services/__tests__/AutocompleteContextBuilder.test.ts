// ABOUTME: Tests for AutocompleteContextBuilder (long-range completion context)
// ABOUTME: Canon facts only; no research documents or derived metadata in the hot path

import { describe, it, expect, vi } from 'vitest';
import { AutocompleteContextBuilder } from '../AutocompleteContextBuilder';

describe('AutocompleteContextBuilder', () => {
  const makeCanonFact = (entity: string, statement: string, validFromChapter: number) => ({
    getEntity: () => entity,
    getStatement: () => statement,
    getValidFromChapter: () => validFromChapter,
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
});
