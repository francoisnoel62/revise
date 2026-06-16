// ABOUTME: Tests for AutocompleteContextBuilder (long-range completion context)
// ABOUTME: Locks: author intent + optional canon; the local scene comes from the cursor window, not here

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutocompleteContextBuilder } from '../AutocompleteContextBuilder';
import { AIContextBuilder } from '../AIContextBuilder';

describe('AutocompleteContextBuilder', () => {
  let aiContextBuilder: AIContextBuilder;

  beforeEach(() => {
    aiContextBuilder = {
      buildResearchContext: vi.fn().mockResolvedValue("\n\n[INTENTION DE L'AUTEUR — RECHERCHE]\n- [NOTE] Ton sombre\n"),
      buildCompletionContext: vi.fn().mockResolvedValue('\n\n[MÉTADONNÉES - STYLE]\nRegistre: soutenu\n'),
    } as unknown as AIContextBuilder;
  });

  it('emits author intent and never the current chapter (the cursor window carries the scene)', async () => {
    const builder = new AutocompleteContextBuilder(aiContextBuilder);

    const { context } = await builder.buildContext({ ownerId: 'o', projectId: 'p', chapterId: 'chap-1' });

    expect(context).not.toContain('[CHAPITRE EN COURS]');
    expect(context).toContain("[INTENTION DE L'AUTEUR — RECHERCHE]");
    expect(context).not.toContain('[MÉTADONNÉES');
    expect(aiContextBuilder.buildCompletionContext).not.toHaveBeenCalled();
    expect(aiContextBuilder.buildResearchContext).toHaveBeenCalledWith('o', 'p', 'chap-1');
  });

  it('includes derived metadata only when opted in', async () => {
    const builder = new AutocompleteContextBuilder(aiContextBuilder);

    const { context } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      includeMetadata: true,
    });

    expect(context).toContain('[MÉTADONNÉES - STYLE]');
    expect(aiContextBuilder.buildCompletionContext).toHaveBeenCalledWith('o', 'p', 'chap-1');
  });

  const makeCanonFact = (entity: string, statement: string, validFromChapter: number) => ({
    getEntity: () => entity,
    getStatement: () => statement,
    getValidFromChapter: () => validFromChapter,
  });

  it('injects the [CANON] section when opted in with entities and a chapter index', async () => {
    const canonRepo = {
      findForSelection: vi.fn().mockResolvedValue([makeCanonFact('Léa', 'est morte', 9)]),
    };
    const builder = new AutocompleteContextBuilder(aiContextBuilder, canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
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
    const builder = new AutocompleteContextBuilder(aiContextBuilder, canonRepo as never);

    const { context } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
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
    const builder = new AutocompleteContextBuilder(aiContextBuilder, canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
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
    const builder = new AutocompleteContextBuilder(aiContextBuilder, canonRepo as never);

    const { context, canonFactsCount } = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      includeCanon: true,
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).not.toContain('[CANON]');
    expect(canonFactsCount).toBe(0);
    // Completion still works: author intent is still present.
    expect(context).toContain("[INTENTION DE L'AUTEUR — RECHERCHE]");
  });
});
