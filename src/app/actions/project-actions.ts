// ABOUTME: Server Actions for Project CRUD operations.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { CreateProjectUseCase } from '@/application/use-cases/CreateProjectUseCase';
import { LoadProjectUseCase } from '@/application/use-cases/LoadProjectUseCase';
import { ListProjectsUseCase } from '@/application/use-cases/ListProjectsUseCase';
import { DeleteProjectUseCase } from '@/application/use-cases/DeleteProjectUseCase';
import { UpdateProjectTitleUseCase } from '@/application/use-cases/UpdateProjectTitleUseCase';
import { UpdateProjectProviderUseCase } from '@/application/use-cases/UpdateProjectProviderUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getIdGenerator,
  getRepository,
  getProviderRepo,
  getMetadataRepo,
  getProjectSettingsRepo,
  getSnapshotRepo,
  getWritingGoalRepo,
  withErrorHandling,
} from './utils';
import { GetActiveWritingGoalUseCase } from '@/application/use-cases/GetActiveWritingGoalUseCase';

/**
 * Serialized project for client transport.
 */
export interface SerializedProject {
  id: string;
  title: string;
  chapters: SerializedChapter[];
  activeChapterId: string | null;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  metadata: {
    wordCount: number;
    characterCount: number;
    lastEdited: string;
  };
}

/**
 * Project list item (lighter than full project).
 */
export interface ProjectListItem {
  id: string;
  title: string;
  chapterCount: number;
  wordCount: number;
  updatedAt: string;
  coverImageUrl?: string;
  activeGoal: { targetWords: number } | null;
}

// === Serialization Helpers ===

function serializeProject(project: Project): SerializedProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getChapters().map(serializeChapter),
    activeChapterId: project.getActiveChapterId(),
    providerId: project.getProviderId(),
    createdAt: project.getCreatedAt().toISOString(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}

function serializeChapter(chapter: Chapter): SerializedChapter {
  const metadata = chapter.getMetadata();
  return {
    id: chapter.getId(),
    title: chapter.getTitle(),
    content: chapter.getContent(),
    order: chapter.getOrder(),
    metadata: {
      wordCount: metadata.wordCount,
      characterCount: metadata.characterCount,
      lastEdited: metadata.lastEdited.toISOString(),
    },
  };
}

interface ProjectListItemExtras {
  coverImageUrl?: string;
  activeGoal: { targetWords: number } | null;
}

function serializeProjectListItem(
  project: Project,
  extras: ProjectListItemExtras
): ProjectListItem {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapterCount: project.getChapterCount(),
    wordCount: project.getTotalWordCount(),
    updatedAt: project.getUpdatedAt().toISOString(),
    coverImageUrl: extras.coverImageUrl,
    activeGoal: extras.activeGoal,
  };
}

// === Server Actions ===

/**
 * Create a new empty project.
 * Delegates to CreateProjectUseCase for business logic.
 *
 * @param title Optional project title
 * @param providerId Optional provider ID for AI operations
 */
export async function createProjectAction(
  title?: string,
  providerId?: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CreateProjectUseCase(
      await getRepository(),
      await getProviderRepo(),
      await getIdGenerator(),
    );

    const project = await useCase.execute({
      ownerId: auth.userId,
      title,
      providerId,
    });

    return serializeProject(project);
  });
}

/**
 * Load a project by ID.
 * Delegates to LoadProjectUseCase for business logic.
 */
export async function loadProjectAction(
  projectId: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new LoadProjectUseCase(await getRepository());

    const project = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    return serializeProject(project);
  });
}

/**
 * List all projects for current user.
 * Delegates to ListProjectsUseCase for business logic.
 * Also fetches cover images and active goals for each project.
 */
export async function listProjectsAction(): Promise<ActionResult<ProjectListItem[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListProjectsUseCase(await getRepository());

    const projects = await useCase.execute({
      ownerId: auth.userId,
    });

    // Fetch settings and goals for all projects in parallel
    const settingsRepo = await getProjectSettingsRepo();
    const goalRepo = await getWritingGoalRepo();
    const getActiveGoalUseCase = new GetActiveWritingGoalUseCase(goalRepo);

    const projectListItems = await Promise.all(
      projects.map(async (project) => {
        const projectId = project.getId();

        // Fetch settings and active goal in parallel
        const [settings, activeGoal] = await Promise.all([
          settingsRepo.findByProjectId(auth.userId, projectId),
          getActiveGoalUseCase.execute({
            userId: auth.userId,
            projectId,
          }),
        ]);

        return serializeProjectListItem(project, {
          coverImageUrl: settings?.getCoverImageUrl(),
          activeGoal: activeGoal
            ? { targetWords: activeGoal.getTargetWords() }
            : null,
        });
      })
    );

    return projectListItems;
  });
}

/**
 * Delete a project.
 * Delegates to DeleteProjectUseCase for business logic.
 * Cascades to delete all project metadata and settings.
 */
export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new DeleteProjectUseCase(
      await getRepository(),
      await getMetadataRepo(),
      await getProjectSettingsRepo(),
      await getSnapshotRepo(),
    );

    await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    return { deleted: true };
  });
}

/**
 * Update project title.
 * Delegates to UpdateProjectTitleUseCase for business logic.
 */
export async function updateProjectTitleAction(
  projectId: string,
  title: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateProjectTitleUseCase(await getRepository());

    const project = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      title,
    });

    return serializeProject(project);
  });
}

/**
 * Update a project's provider.
 * Delegates to UpdateProjectProviderUseCase for business logic.
 *
 * @param projectId The project ID to update
 * @param providerId The new provider ID (or null to clear)
 * @returns Action result with updated project or error
 */
export async function updateProjectProviderAction(
  projectId: string,
  providerId: string | null
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateProjectProviderUseCase(
      await getRepository(),
      await getProviderRepo()
    );

    const project = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      providerId,
    });

    return serializeProject(project);
  });
}
