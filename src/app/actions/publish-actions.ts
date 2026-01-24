// ABOUTME: Server Actions for publishing and unpublishing projects.
// ABOUTME: Handles public share link generation and loading published projects.

'use server';

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { PublishProjectUseCase } from '@/application/use-cases/PublishProjectUseCase';
import { UnpublishProjectUseCase } from '@/application/use-cases/UnpublishProjectUseCase';
import { LoadPublishedProjectUseCase } from '@/application/use-cases/LoadPublishedProjectUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  withErrorHandling,
} from './utils';
import { config } from '@/infrastructure/config/env';

/**
 * Serialized project for public reading (no sensitive data).
 */
export interface PublicProject {
  id: string;
  title: string;
  chapters: PublicChapter[];
  publishedAt: string | null;
}

export interface PublicChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

/**
 * Result from publishing a project.
 */
export interface PublishResult {
  shareUrl: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishedChapterIds: string[] | null;
}

// === Serialization Helpers ===

function serializePublicProject(project: Project): PublicProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getPublishedChapters().map(serializePublicChapter),
    publishedAt: project.getPublishedAt()?.toISOString() ?? null,
  };
}

function serializePublicChapter(chapter: Chapter): PublicChapter {
  return {
    id: chapter.getId(),
    title: chapter.getTitle(),
    content: chapter.getContent(),
    order: chapter.getOrder(),
    wordCount: chapter.getMetadata().wordCount,
  };
}

// === Server Actions ===

/**
 * Publish a project with a shareable link.
 * Requires authentication.
 * @param projectId - The project to publish
 * @param chapterIds - Optional list of chapter IDs to publish. If not provided, all chapters are published.
 */
export async function publishProjectAction(
  projectId: string,
  chapterIds?: string[]
): Promise<ActionResult<PublishResult>> {
  console.log('[publishProjectAction] Called with:', {
    projectId,
    chapterIds,
    chapterIdsLength: chapterIds?.length,
  });

  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new PublishProjectUseCase(
      await getRepository(),
      config.app.baseUrl
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      chapterIds,
    });

    console.log('[publishProjectAction] Result:', {
      shareUrl: result.shareUrl,
      isPublished: result.project.getIsPublished(),
      publishedChapterIds: result.project.getPublishedChapterIds(),
    });

    return {
      shareUrl: result.shareUrl,
      isPublished: result.project.getIsPublished(),
      publishedAt: result.project.getPublishedAt()?.toISOString() ?? null,
      publishedChapterIds: result.project.getPublishedChapterIds(),
    };
  });
}

/**
 * Unpublish a project.
 * The share link will no longer work.
 * Requires authentication.
 */
export async function unpublishProjectAction(
  projectId: string
): Promise<ActionResult<{ isPublished: boolean }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UnpublishProjectUseCase(await getRepository());

    const project = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    return {
      isPublished: project.getIsPublished(),
    };
  });
}

/**
 * Load a published project via share token.
 * Does NOT require authentication - public access.
 */
export async function loadPublishedProjectAction(
  projectId: string,
  shareToken: string
): Promise<ActionResult<PublicProject>> {
  console.log('[loadPublishedProjectAction] Loading project:', {
    projectId,
    shareToken: shareToken?.substring(0, 8) + '...',
  });

  return withErrorHandling(async () => {
    const useCase = new LoadPublishedProjectUseCase(await getRepository());

    const project = await useCase.execute({
      projectId,
      shareToken,
    });

    console.log('[loadPublishedProjectAction] Project found:', {
      id: project.getId(),
      title: project.getTitle(),
      isPublished: project.getIsPublished(),
      publishedChapterIds: project.getPublishedChapterIds(),
      totalChapters: project.getChapters().length,
      publishedChaptersCount: project.getPublishedChapters().length,
    });

    return serializePublicProject(project);
  });
}

/**
 * Get the current publish status of a project.
 * Requires authentication.
 */
export async function getPublishStatusAction(
  projectId: string
): Promise<ActionResult<{
  isPublished: boolean;
  shareUrl: string | null;
  publishedAt: string | null;
  publishedChapterIds: string[] | null;
}>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getRepository();
    const project = await repo.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const shareToken = project.getShareToken();
    const shareUrl = shareToken
      ? `${config.app.baseUrl}/read/${project.getId()}/${shareToken}`
      : null;

    return {
      isPublished: project.getIsPublished(),
      shareUrl,
      publishedAt: project.getPublishedAt()?.toISOString() ?? null,
      publishedChapterIds: project.getPublishedChapterIds(),
    };
  });
}
