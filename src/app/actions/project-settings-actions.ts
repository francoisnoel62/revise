// ABOUTME: Server actions for project settings CRUD operations
// ABOUTME: Provides API for managing project settings (title, cover, narration, etc.)

'use server';

import { getProjectSettingsRepo, getIdGenerator, getBlobStorageInstance, getAuthenticatedUserId } from './utils';
import { CreateProjectSettingsUseCase } from '@/application/use-cases/CreateProjectSettingsUseCase';
import { LoadProjectSettingsUseCase } from '@/application/use-cases/LoadProjectSettingsUseCase';
import { UpdateProjectSettingsUseCase, ProjectSettingsUpdates } from '@/application/use-cases/UpdateProjectSettingsUseCase';
import { UploadCoverImageUseCase } from '@/application/use-cases/UploadCoverImageUseCase';
import { DeleteCoverImageUseCase } from '@/application/use-cases/DeleteCoverImageUseCase';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { Contributor } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '@/domain/value-objects/NarrationSettings';
import { AutocompletePreferences } from '@/domain/value-objects/AutocompletePreferences';

export interface SerializedProjectSettings {
  id: string;
  projectId: string;
  title: string;
  subtitle?: string;
  summary: string;
  coverImageUrl?: string;
  genre: string;
  synopsis: string;
  pointOfView?: PointOfView;
  tense?: NarrationTense;
  targetAudience?: TargetAudience;
  isbn?: string;
  contributors: Contributor[];
  relatedWorks: RelatedWork[];
  createdAt: string;
  updatedAt: string;
  autocompletePreferences: AutocompletePreferences;
}

function serializeProjectSettings(settings: ProjectSettings): SerializedProjectSettings {
  return {
    id: settings.getId(),
    projectId: settings.getProjectId(),
    title: settings.getTitle(),
    subtitle: settings.getSubtitle(),
    summary: settings.getSummary(),
    coverImageUrl: settings.getCoverImageUrl(),
    genre: settings.getGenre(),
    synopsis: settings.getSynopsis(),
    pointOfView: settings.getPointOfView(),
    tense: settings.getTense(),
    targetAudience: settings.getTargetAudience(),
    isbn: settings.getIsbn(),
    contributors: settings.getContributors(),
    relatedWorks: settings.getRelatedWorks(),
    createdAt: settings.getCreatedAt().toISOString(),
    updatedAt: settings.getUpdatedAt().toISOString(),
    autocompletePreferences: settings.getAutocompletePreferences(),
  };
}

export async function createProjectSettingsAction(
  projectId: string,
  title: string
): Promise<{ success: true; settings: SerializedProjectSettings } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new CreateProjectSettingsUseCase(
      await getProjectSettingsRepo(),
      await getIdGenerator()
    );

    const settings = await useCase.execute({
      userId: authResult.userId,
      projectId,
      title,
    });

    return { success: true, settings: serializeProjectSettings(settings) };
  } catch (error) {
    console.error('Error creating project settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function loadProjectSettingsAction(
  projectId: string
): Promise<{ success: true; settings: SerializedProjectSettings | null } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new LoadProjectSettingsUseCase(await getProjectSettingsRepo());

    const settings = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return {
      success: true,
      settings: settings ? serializeProjectSettings(settings) : null,
    };
  } catch (error) {
    console.error('Error loading project settings:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}

export async function updateProjectSettingsAction(
  projectId: string,
  updates: ProjectSettingsUpdates
): Promise<{ success: true; settings: SerializedProjectSettings } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new UpdateProjectSettingsUseCase(await getProjectSettingsRepo());

    const settings = await useCase.execute({
      userId: authResult.userId,
      projectId,
      updates,
    });

    return { success: true, settings: serializeProjectSettings(settings) };
  } catch (error) {
    console.error('Error updating project settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function uploadCoverImageAction(
  projectId: string,
  formData: FormData
): Promise<{ success: true; settings: SerializedProjectSettings } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Aucun fichier fourni' };
    }

    const useCase = new UploadCoverImageUseCase(
      await getProjectSettingsRepo(),
      await getBlobStorageInstance()
    );

    const arrayBuffer = await file.arrayBuffer();

    const settings = await useCase.execute({
      userId: authResult.userId,
      projectId,
      file: arrayBuffer,
      filename: file.name,
      contentType: file.type,
    });

    return { success: true, settings: serializeProjectSettings(settings) };
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'upload",
    };
  }
}

export async function deleteCoverImageAction(
  projectId: string
): Promise<{ success: true; settings: SerializedProjectSettings } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const useCase = new DeleteCoverImageUseCase(
      await getProjectSettingsRepo(),
      await getBlobStorageInstance()
    );

    const settings = await useCase.execute({
      userId: authResult.userId,
      projectId,
    });

    return { success: true, settings: serializeProjectSettings(settings) };
  } catch (error) {
    console.error('Error deleting cover image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}
