// ABOUTME: Tests for AutocompleteContextBuilder (manuscript-first completion context)
// ABOUTME: Locks: chapter text first, author intent, and metadata excluded by default

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutocompleteContextBuilder } from '../AutocompleteContextBuilder';
import { AIContextBuilder } from '../AIContextBuilder';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

const makeChapter = (id: string, text: string) => ({
  getId: () => id,
  getTitle: () => 'Chapitre',
  getContent: () =>
    JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }),
});

function makeProjectRepo(chapters: ReturnType<typeof makeChapter>[]): ProjectRepository {
  return {
    loadProject: vi.fn().mockResolvedValue({ getChapters: () => chapters }),
  } as unknown as ProjectRepository;
}

describe('AutocompleteContextBuilder', () => {
  let aiContextBuilder: AIContextBuilder;

  beforeEach(() => {
    aiContextBuilder = {
      buildResearchContext: vi.fn().mockResolvedValue("\n\n[INTENTION DE L'AUTEUR — RECHERCHE]\n- [NOTE] Ton sombre\n"),
      buildCompletionContext: vi.fn().mockResolvedValue('\n\n[MÉTADONNÉES - STYLE]\nRegistre: soutenu\n'),
    } as unknown as AIContextBuilder;
  });

  it('puts the current chapter text first and excludes metadata by default', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Elle ouvrit la porte.')]);
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder);

    const context = await builder.buildContext({ ownerId: 'o', projectId: 'p', chapterId: 'chap-1' });

    expect(context).toContain('[CHAPITRE EN COURS]');
    expect(context).toContain('Elle ouvrit la porte.');
    expect(context).toContain("[INTENTION DE L'AUTEUR — RECHERCHE]");
    expect(context).not.toContain('[MÉTADONNÉES');
    expect(aiContextBuilder.buildCompletionContext).not.toHaveBeenCalled();
    expect(aiContextBuilder.buildResearchContext).toHaveBeenCalledWith('o', 'p', 'chap-1');
  });

  it('includes derived metadata only when opted in', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder);

    const context = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      includeMetadata: true,
    });

    expect(context).toContain('[MÉTADONNÉES - STYLE]');
    expect(aiContextBuilder.buildCompletionContext).toHaveBeenCalledWith('o', 'p', 'chap-1');
  });

  it('keeps only the tail of a long chapter', async () => {
    const long = 'A'.repeat(2000) + 'FINDUTEXTE';
    const repo = makeProjectRepo([makeChapter('chap-1', long)]);
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder);

    const context = await builder.buildContext({ ownerId: 'o', projectId: 'p', chapterId: 'chap-1' });

    expect(context).toContain('FINDUTEXTE');
    expect(context).toContain('…');
  });

  it('degrades gracefully when the project is missing', async () => {
    const repo = { loadProject: vi.fn().mockResolvedValue(null) } as unknown as ProjectRepository;
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder);

    const context = await builder.buildContext({ ownerId: 'o', projectId: 'p', chapterId: 'chap-1' });

    expect(context).not.toContain('[CHAPITRE EN COURS]');
    expect(context).toContain("[INTENTION DE L'AUTEUR — RECHERCHE]");
  });

  it('omits chapter context when no chapterId is given', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder);

    const context = await builder.buildContext({ ownerId: 'o', projectId: 'p' });

    expect(context).not.toContain('[CHAPITRE EN COURS]');
    expect(repo.loadProject).not.toHaveBeenCalled();
  });

  const makeCanonFact = (entity: string, statement: string, validFromChapter: number) => ({
    getEntity: () => entity,
    getStatement: () => statement,
    getValidFromChapter: () => validFromChapter,
  });

  it('injects the [CANON] section when opted in with entities and a chapter index', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const canonRepo = {
      findForSelection: vi
        .fn()
        .mockResolvedValue([makeCanonFact('Léa', 'est morte', 9)]),
    };
    const builder = new AutocompleteContextBuilder(
      repo,
      aiContextBuilder,
      canonRepo as never
    );

    const context = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      includeCanon: true,
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).toContain('[CANON]');
    expect(context).toContain('Léa : est morte (depuis ch.10)');
    expect(canonRepo.findForSelection).toHaveBeenCalledWith('o', 'p', ['Léa'], 11);
  });

  it('omits [CANON] when no entities are detected', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const canonRepo = { findForSelection: vi.fn().mockResolvedValue([]) };
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder, canonRepo as never);

    const context = await builder.buildContext({
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
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const canonRepo = {
      findForSelection: vi.fn().mockResolvedValue([makeCanonFact('Léa', 'est morte', 9)]),
    };
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder, canonRepo as never);

    const context = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).not.toContain('[CANON]');
    expect(canonRepo.findForSelection).not.toHaveBeenCalled();
  });

  it('degrades gracefully when canon selection throws', async () => {
    const repo = makeProjectRepo([makeChapter('chap-1', 'Texte')]);
    const canonRepo = {
      findForSelection: vi.fn().mockRejectedValue(new Error('db down')),
    };
    const builder = new AutocompleteContextBuilder(repo, aiContextBuilder, canonRepo as never);

    const context = await builder.buildContext({
      ownerId: 'o',
      projectId: 'p',
      chapterId: 'chap-1',
      includeCanon: true,
      entities: ['Léa'],
      chapterIndex: 11,
    });

    expect(context).not.toContain('[CANON]');
    expect(context).toContain('[CHAPITRE EN COURS]');
  });
});
