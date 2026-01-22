// ABOUTME: Server actions for character CRUD operations
// ABOUTME: Provides API for creating, listing, updating, and deleting characters

'use server';

import { getCharacterRepo, getIdGenerator, getAuthenticatedUserId } from './utils';
import { CreateCharacterUseCase } from '@/application/use-cases/CreateCharacterUseCase';
import { LoadCharacterUseCase } from '@/application/use-cases/LoadCharacterUseCase';
import { ListProjectCharactersUseCase } from '@/application/use-cases/ListProjectCharactersUseCase';
import { UpdateCharacterUseCase } from '@/application/use-cases/UpdateCharacterUseCase';
import { DeleteCharacterUseCase } from '@/application/use-cases/DeleteCharacterUseCase';
import { SyncCharactersFromAnalysisUseCase, SyncResult } from '@/application/use-cases/SyncCharactersFromAnalysisUseCase';
import { Character } from '@/domain/entities/Character';
import { CharacterProfile } from '@/domain/value-objects/Characters';

export interface SerializedCharacter {
  id: string;
  projectId: string;
  name: string;
  identity: string;
  appearance: string;
  psychology: string;
  voiceAndLanguage: string;
  backstory: string;
  relationships: string;
  narrativeFunction: string;
  openQuestions: string;
  createdAt: string;
  updatedAt: string;
}

function serializeCharacter(character: Character): SerializedCharacter {
  return {
    id: character.getId(),
    projectId: character.getProjectId(),
    name: character.getName(),
    identity: character.getIdentity(),
    appearance: character.getAppearance(),
    psychology: character.getPsychology(),
    voiceAndLanguage: character.getVoiceAndLanguage(),
    backstory: character.getBackstory(),
    relationships: character.getRelationships(),
    narrativeFunction: character.getNarrativeFunction(),
    openQuestions: character.getOpenQuestions(),
    createdAt: character.getCreatedAt().toISOString(),
    updatedAt: character.getUpdatedAt().toISOString(),
  };
}

export async function createCharacterAction(
  projectId: string,
  name: string
): Promise<{ success: true; character: SerializedCharacter } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new CreateCharacterUseCase(
      await getCharacterRepo(),
      await getIdGenerator()
    );

    const character = await useCase.execute({
      userId: authResult.userId,
      projectId,
      name,
    });

    return { success: true, character: serializeCharacter(character) };
  } catch (error) {
    console.error('Error creating character:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function loadCharacterAction(
  characterId: string
): Promise<{ success: true; character: SerializedCharacter } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new LoadCharacterUseCase(await getCharacterRepo());

    const character = await useCase.execute({
      userId: authResult.userId,
      characterId,
    });

    if (!character) {
      return { success: false, error: 'Personnage non trouvé' };
    }

    return { success: true, character: serializeCharacter(character) };
  } catch (error) {
    console.error('Error loading character:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}

export async function listCharactersAction(
  projectId: string
): Promise<{ success: true; characters: SerializedCharacter[] } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new ListProjectCharactersUseCase(await getCharacterRepo());

    const characters = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, characters: characters.map(serializeCharacter) };
  } catch (error) {
    console.error('Error listing characters:', error);
    return { success: false, error: 'Erreur lors du chargement des personnages' };
  }
}

export async function updateCharacterAction(
  characterId: string,
  updates: {
    name?: string;
    identity?: string;
    appearance?: string;
    psychology?: string;
    voiceAndLanguage?: string;
    backstory?: string;
    relationships?: string;
    narrativeFunction?: string;
    openQuestions?: string;
  }
): Promise<{ success: true; character: SerializedCharacter } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new UpdateCharacterUseCase(await getCharacterRepo());

    const character = await useCase.execute({
      userId: authResult.userId,
      characterId,
      ...updates,
    });

    return { success: true, character: serializeCharacter(character) };
  } catch (error) {
    console.error('Error updating character:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function deleteCharacterAction(
  characterId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new DeleteCharacterUseCase(await getCharacterRepo());

    await useCase.execute({
      userId: authResult.userId,
      characterId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting character:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}

export async function syncCharactersFromAnalysisAction(
  projectId: string,
  characterProfiles: CharacterProfile[]
): Promise<
  | {
      success: true;
      result: {
        created: SerializedCharacter[];
        updated: SerializedCharacter[];
        skipped: string[];
      };
    }
  | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new SyncCharactersFromAnalysisUseCase(
      await getCharacterRepo(),
      await getIdGenerator()
    );

    const result: SyncResult = await useCase.execute({
      userId: authResult.userId,
      projectId,
      characterProfiles,
    });

    return {
      success: true,
      result: {
        created: result.created.map(serializeCharacter),
        updated: result.updated.map(serializeCharacter),
        skipped: result.skipped,
      },
    };
  } catch (error) {
    console.error('Error syncing characters from analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la synchronisation',
    };
  }
}

export async function getCharacterCountAction(
  projectId: string
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repo = await getCharacterRepo();
    const count = await repo.countByProjectId(authResult.userId, projectId);

    return { success: true, count };
  } catch (error) {
    console.error('Error getting character count:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}
