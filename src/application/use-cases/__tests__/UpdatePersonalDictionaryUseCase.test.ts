// ABOUTME: Tests the write path of a project's own vocabulary, compiled once when it is saved.
// ABOUTME: Verifies owner isolation, normalization, and that the automaton follows the list.

import { describe, expect, it, vi } from 'vitest';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import type { GrammarDictionaryCompiler } from '@/domain/interfaces/GrammarDictionaryCompiler';
import type { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { UpdatePersonalDictionaryUseCase } from '../UpdatePersonalDictionaryUseCase';

const OWNER_ID = 'owner-1';
const PROJECT_ID = 'project-1';

function buildUseCase(options?: { settings?: ProjectSettings | null }) {
  const settings =
    options?.settings === undefined
      ? ProjectSettings.create('settings-1', PROJECT_ID, OWNER_ID, 'Roman')
      : options.settings;

  const saved: ProjectSettings[] = [];
  const requestedOwnerIds: string[] = [];
  const repository = {
    findByProjectId: async (ownerId: string, projectId: string) => {
      requestedOwnerIds.push(ownerId);
      return ownerId === OWNER_ID && projectId === PROJECT_ID ? settings : null;
    },
    update: async (ownerId: string, updated: ProjectSettings) => {
      requestedOwnerIds.push(ownerId);
      saved.push(updated);
      return updated;
    },
  } as unknown as ProjectSettingsRepository;

  const compile = vi.fn().mockReturnValue({ nEntry: 1 });
  const compiler: GrammarDictionaryCompiler = { compile };

  return {
    useCase: new UpdatePersonalDictionaryUseCase(repository, compiler),
    saved,
    requestedOwnerIds,
    compile,
  };
}

describe('UpdatePersonalDictionaryUseCase', () => {
  it('compiles the vocabulary once and saves it with the list', async () => {
    const { useCase, saved, compile } = buildUseCase();

    const result = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      entries: [{ word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' }],
    });

    expect(compile).toHaveBeenCalledTimes(1);
    expect(saved).toHaveLength(1);
    expect(saved[0].getCustomDictionary()).toEqual([
      { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
    ]);
    expect(saved[0].getGrammarDictionary()).toEqual({ nEntry: 1 });
    expect(result.entries).toEqual(saved[0].getCustomDictionary());
  });

  it('normalizes what it is given, bare words included', async () => {
    const { useCase, saved } = buildUseCase();

    await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      entries: ['  Arrakis  ', { word: 'krogan', nature: 'noun' }],
    });

    expect(saved[0].getCustomDictionary()).toEqual([
      { word: 'Arrakis' },
      { word: 'krogan', nature: 'noun' },
    ]);
  });

  it('refuses two entries for the same word', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        ownerId: OWNER_ID,
        projectId: PROJECT_ID,
        entries: [{ word: 'krogan', nature: 'noun' }, { word: 'krogan' }],
      })
    ).rejects.toThrow(/krogan/);
  });

  it('reads and writes for the requesting owner only', async () => {
    const { useCase, requestedOwnerIds } = buildUseCase();

    await useCase.execute({ ownerId: OWNER_ID, projectId: PROJECT_ID, entries: [] });

    expect(requestedOwnerIds).toEqual([OWNER_ID, OWNER_ID]);
  });

  it('refuses a project the owner has no settings for', async () => {
    const { useCase } = buildUseCase({ settings: null });

    await expect(
      useCase.execute({ ownerId: OWNER_ID, projectId: PROJECT_ID, entries: [] })
    ).rejects.toThrow('Project settings not found');
  });
});
