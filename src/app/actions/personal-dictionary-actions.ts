// ABOUTME: Server actions reading and writing the vocabulary a project invented.
// ABOUTME: Every write compiles the grammar dictionary, so no chapter check has to.

'use server';

import { UpdatePersonalDictionaryUseCase } from '@/application/use-cases/UpdatePersonalDictionaryUseCase';
import { getGrammarDictionaryCompiler } from '@/infrastructure/config/providers';
import type { PersonalDictionaryEntry } from '@/domain/value-objects/PersonalDictionaryEntry';
import { getAuthenticatedUserId, getProjectSettingsRepo } from './utils';

export async function getPersonalDictionaryAction(
  projectId: string
): Promise<PersonalDictionaryEntry[]> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return [];

  const repo = await getProjectSettingsRepo();
  const settings = await repo.findByProjectId(authResult.userId, projectId);
  return settings?.getCustomDictionary() ?? [];
}

export async function savePersonalDictionaryAction(
  projectId: string,
  entries: PersonalDictionaryEntry[]
): Promise<PersonalDictionaryEntry[]> {
  const authResult = await getAuthenticatedUserId();
  if ('error' in authResult) return [];

  const useCase = new UpdatePersonalDictionaryUseCase(
    await getProjectSettingsRepo(),
    getGrammarDictionaryCompiler()
  );
  const result = await useCase.execute({
    ownerId: authResult.userId,
    projectId,
    entries,
  });

  return result.entries;
}
