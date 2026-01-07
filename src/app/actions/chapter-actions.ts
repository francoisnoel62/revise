// ABOUTME: Server Actions for Chapter operations within a Project.
// ABOUTME: All operations load project, modify, and persist.

'use server';

import { randomUUID } from 'crypto';
import { Chapter } from '@/domain/entities/Chapter';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  withErrorHandling,
} from './utils';
import { SerializedProject, SerializedChapter } from './project-actions';

// Re-use serialization from project-actions
function serializeProject(project: import('@/domain/entities/Project').Project): SerializedProject {
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
    createdAt: project.getCreatedAt().toISOString(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}

/**
 * Add a new chapter to a project.
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

    // Create new chapter
    const chapterCount = project.getChapterCount();
    const newChapter = new Chapter(
      randomUUID(),
      `Chapitre ${chapterCount + 1}`,
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      chapterCount
    );

    project.addChapter(newChapter);
    await repository.updateProject(auth.userId, project);

    return serializeProject(project);
  });
}

/**
 * Remove a chapter from a project.
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

    project.removeChapter(chapterId);
    await repository.updateProject(auth.userId, project);

    return serializeProject(project);
  });
}

/**
 * Reorder chapters within a project.
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

    project.reorderChapters(fromIndex, toIndex);
    await repository.updateProject(auth.userId, project);

    return serializeProject(project);
  });
}

/**
 * Update a chapter's title.
 */
export async function updateChapterTitleAction(
  projectId: string,
  chapterId: string,
  title: string
): Promise<ActionResult<SerializedChapter>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const chapter = project.getChapter(chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    chapter.updateTitle(title);
    await repository.updateChapter(auth.userId, projectId, chapter);

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
  });
}

/**
 * Update a chapter's content.
 * Used for autosave and manual saves.
 */
export async function updateChapterContentAction(
  projectId: string,
  chapterId: string,
  content: string
): Promise<ActionResult<{ saved: true; updatedAt: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const chapter = project.getChapter(chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    chapter.updateContent(content);
    await repository.updateChapter(auth.userId, projectId, chapter);

    return {
      saved: true,
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Set active chapter for a project.
 * Saves current chapter content before switching.
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

    // Save current chapter content if provided
    if (currentChapterId && currentContent !== null) {
      const currentChapter = project.getChapter(currentChapterId);
      if (currentChapter) {
        currentChapter.updateContent(currentContent);
        await repository.updateChapter(auth.userId, projectId, currentChapter);
      }
    }

    // Switch active chapter
    project.setActiveChapter(chapterId);
    await repository.updateProject(auth.userId, project);

    return serializeProject(project);
  });
}
