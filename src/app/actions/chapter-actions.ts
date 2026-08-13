// ABOUTME: Server Actions for Chapter operations within a Project.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { AddChapterUseCase } from '@/application/use-cases/AddChapterUseCase';
import { RemoveChapterUseCase } from '@/application/use-cases/RemoveChapterUseCase';
import { ReorderChaptersUseCase } from '@/application/use-cases/ReorderChaptersUseCase';
import { UpdateChapterTitleUseCase } from '@/application/use-cases/UpdateChapterTitleUseCase';
import { UpdateChapterContentUseCase } from '@/application/use-cases/UpdateChapterContentUseCase';
import { SwitchChapterUseCase } from '@/application/use-cases/SwitchChapterUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getAutomaticSnapshotRepo,
  getIdGenerator,
  getRepository,
  withErrorHandling,
} from './utils';
import { SerializedProject, SerializedChapter } from './project-actions';
import { recordWordCountSnapshot } from './word-count-tracking';

// Re-use serialization from project-actions
function serializeProject(project: Project): SerializedProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getChapters().map((ch) => ({
      id: ch.getId(),
      title: ch.getTitle(),
      content: ch.getContent(),
      order: ch.getOrder(),
      metadata: {
        wordCount: ch.getMetadata().wordCount,
        characterCount: ch.getMetadata().characterCount,
        lastEdited: ch.getMetadata().lastEdited.toISOString(),
      },
    })),
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

/**
 * Add a new chapter to a project.
 * Delegates to AddChapterUseCase for business logic.
 */
export async function addChapterAction(
  projectId: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Delegate to Use Case
    const useCase = new AddChapterUseCase(await getIdGenerator());
    useCase.execute(project);

    await repository.updateProject(auth.userId, project);
    return serializeProject(project);
  });
}

/**
 * Remove a chapter from a project.
 * Delegates to RemoveChapterUseCase for business logic.
 */
export async function removeChapterAction(
  projectId: string,
  chapterId: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Delegate to Use Case
    const useCase = new RemoveChapterUseCase();
    useCase.execute(project, chapterId);

    await repository.updateProject(auth.userId, project);
    return serializeProject(project);
  });
}

/**
 * Reorder chapters within a project.
 * Delegates to ReorderChaptersUseCase for business logic.
 */
export async function reorderChaptersAction(
  projectId: string,
  fromIndex: number,
  toIndex: number
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Delegate to Use Case
    const useCase = new ReorderChaptersUseCase();
    useCase.execute(project, fromIndex, toIndex);

    await repository.updateProject(auth.userId, project);
    return serializeProject(project);
  });
}

/**
 * Update a chapter's title.
 * Delegates to UpdateChapterTitleUseCase for business logic.
 */
export interface UpdatedChapterTitleResult {
  chapter: SerializedChapter;
  /** The project's persisted updatedAt after this write — not a freshly-computed guess. */
  projectUpdatedAt: string;
}

export async function updateChapterTitleAction(
  projectId: string,
  chapterId: string,
  title: string
): Promise<ActionResult<UpdatedChapterTitleResult>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Delegate to Use Case
    const useCase = new UpdateChapterTitleUseCase();
    useCase.execute(project, chapterId, title);

    const chapter = project.getChapter(chapterId)!;
    await repository.updateChapter(auth.userId, projectId, chapter);

    // Read back the persisted updatedAt (see updateChapterContentAction for why).
    const savedProject = await repository.loadProject(auth.userId, projectId);

    return {
      chapter: serializeChapter(chapter),
      projectUpdatedAt: savedProject!.getUpdatedAt().toISOString(),
    };
  });
}

/**
 * Update a chapter's content.
 * Used for autosave and manual saves.
 * Delegates to UpdateChapterContentUseCase for business logic.
 */
export async function updateChapterContentAction(
  projectId: string,
  chapterId: string,
  content: string,
  timeZone: string = 'UTC'
): Promise<ActionResult<{ saved: true; updatedAt: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Capture the total before the edit so a first-ever snapshot can seed a
    // baseline (pre-existing words must not count as written today/this week).
    const previousTotalWords = project.getTotalWordCount();

    // Delegate to Use Case
    const useCase = new UpdateChapterContentUseCase();
    useCase.execute(project, chapterId, content);

    const chapter = project.getChapter(chapterId)!;
    await repository.updateChapter(auth.userId, projectId, chapter);

    // Record the project's total word count for today's writing activity journal.
    // Best-effort: never lets snapshot recording fail the save.
    await recordWordCountSnapshot(
      auth.userId,
      projectId,
      project.getTotalWordCount(),
      timeZone,
      previousTotalWords
    );

    // Best-effort just like word-count tracking: an automatic snapshot concern
    // must never make the author's autosave fail.
    try {
      await (await getAutomaticSnapshotRepo()).recordSavedChange(
        auth.userId,
        projectId,
        new Date(),
      );
    } catch (error) {
      console.error('Unable to record automatic snapshot change', { projectId, error });
    }

    // Read back the persisted updatedAt rather than computing a fresh Date here:
    // updateChapter's underlying $set stamps its own timestamp, so this call's
    // own `new Date()` would differ from what was actually written — silently
    // breaking any caller relying on an exact match (e.g. restore's optimistic
    // concurrency check).
    const savedProject = await repository.loadProject(auth.userId, projectId);

    return {
      saved: true,
      updatedAt: savedProject!.getUpdatedAt().toISOString(),
    };
  });
}

/**
 * Set active chapter for a project.
 * Saves current chapter content before switching.
 * Delegates to SwitchChapterUseCase for business logic.
 */
export async function setActiveChapterAction(
  projectId: string,
  chapterId: string,
  currentChapterId: string | null,
  currentContent: string | null
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Save current chapter content if provided (before switching)
    if (currentChapterId && currentContent !== null) {
      const currentChapter = project.getChapter(currentChapterId);
      if (currentChapter) {
        currentChapter.updateContent(currentContent);
        await repository.updateChapter(auth.userId, projectId, currentChapter);
      }
    }

    // Delegate to Use Case for switching
    const useCase = new SwitchChapterUseCase();
    await useCase.execute(project, chapterId, currentContent || '');

    await repository.updateProject(auth.userId, project);
    return serializeProject(project);
  });
}
