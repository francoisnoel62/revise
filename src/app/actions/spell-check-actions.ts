// ABOUTME: Server action for dictionary-based spell checking using nspell + fr-FR dictionary
// ABOUTME: Returns misspelled words with correction suggestions — zero AI tokens

'use server';

import type { SpellCheckResult } from '@/domain/interfaces/SpellChecker';
import { CheckSpellingUseCase } from '@/application/use-cases/CheckSpellingUseCase';
import { UpdatePersonalDictionaryUseCase } from '@/application/use-cases/UpdatePersonalDictionaryUseCase';
import {
  getGrammarDictionaryCompiler,
  getSpellChecker,
} from '@/infrastructure/config/providers';
import { getAuthenticatedUserId, getProjectSettingsRepo } from './utils';

export type SpellCheckWordResult = SpellCheckResult;

/**
 * Checks a list of unique words against the French dictionary.
 * The acceptance rules — capitals, single letters, the author's own vocabulary —
 * live in CheckSpellingUseCase, where they can be exercised without an engine.
 */
export async function checkSpellingAction(
  words: string[],
  customWords?: string[]
): Promise<SpellCheckWordResult[]> {
  if (words.length === 0) return [];

  const useCase = new CheckSpellingUseCase(await getSpellChecker());
  return useCase.execute({ words, acceptedWords: customWords });
}

/** Every written form of the project's vocabulary — declared plurals included. */
export async function getCustomDictionaryAction(projectId: string): Promise<string[]> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return [];

  const repo = await getProjectSettingsRepo();
  const settings = await repo.findByProjectId(authResult.userId, projectId);
  return settings?.getCustomDictionaryWords() ?? [];
}

/**
 * Adds a word without describing it, from the spell-check palette.
 *
 * It writes through the entity rather than UpdatePersonalDictionaryUseCase because
 * an undeclared word produces no flexion: the compiled dictionary is unchanged and
 * has nothing to rebuild. Removing a word can drop a declaration, so its sibling
 * below does go through the use case.
 */
export async function addWordToCustomDictionaryAction(
  projectId: string,
  word: string
): Promise<void> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return;

  const repo = await getProjectSettingsRepo();
  const existing = await repo.findByProjectId(authResult.userId, projectId);
  if (!existing) return;

  const updated = existing.addWordToCustomDictionary(word);
  if (updated === existing) return;

  await repo.update(authResult.userId, updated);
}

export async function removeWordFromCustomDictionaryAction(
  projectId: string,
  word: string
): Promise<void> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return;

  const repo = await getProjectSettingsRepo();
  const existing = await repo.findByProjectId(authResult.userId, projectId);
  if (!existing) return;

  const useCase = new UpdatePersonalDictionaryUseCase(repo, getGrammarDictionaryCompiler());
  await useCase.execute({
    ownerId: authResult.userId,
    projectId,
    entries: existing.getCustomDictionary().filter((entry) => entry.word !== word),
  });
}

export async function getIgnoredWordsAction(projectId: string): Promise<string[]> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return [];

  const repo = await getProjectSettingsRepo();
  const settings = await repo.findByProjectId(authResult.userId, projectId);
  return settings?.getIgnoredWords() ?? [];
}

export async function addIgnoredWordAction(
  projectId: string,
  word: string
): Promise<void> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return;

  const repo = await getProjectSettingsRepo();
  const existing = await repo.findByProjectId(authResult.userId, projectId);
  if (!existing) return;

  const updated = existing.addIgnoredWord(word);
  if (updated === existing) return;

  await repo.update(authResult.userId, updated);
}

export async function removeIgnoredWordAction(
  projectId: string,
  word: string
): Promise<void> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return;

  const repo = await getProjectSettingsRepo();
  const existing = await repo.findByProjectId(authResult.userId, projectId);
  if (!existing) return;

  const updated = existing.removeIgnoredWord(word);
  if (updated === existing) return;

  await repo.update(authResult.userId, updated);
}

export async function clearIgnoredWordsAction(projectId: string): Promise<void> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return;

  const repo = await getProjectSettingsRepo();
  const existing = await repo.findByProjectId(authResult.userId, projectId);
  if (!existing) return;

  await repo.update(authResult.userId, existing.clearIgnoredWords());
}
