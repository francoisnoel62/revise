// ABOUTME: Server Actions for Project CRUD operations.
// ABOUTME: All operations require authentication and use MongoDB persistence.

'use server';

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  withErrorHandling,
} from './utils';

/**
 * Serialized project for client transport.
 */
export interface SerializedProject {
  id: string;
  title: string;
  chapters: SerializedChapter[];
  activeChapterId: string | null;
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
}

// === Serialization Helpers ===

function serializeProject(project: Project): SerializedProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getChapters().map(serializeChapter),
    activeChapterId: project.getActiveChapterId(),
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

function serializeProjectListItem(project: Project): ProjectListItem {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapterCount: project.getChapterCount(),
    wordCount: project.getTotalWordCount(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}

// === Server Actions ===

/**
 * Create a new empty project.
 */
export async function createProjectAction(
  title?: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = Project.createEmpty(auth.userId, title || 'Nouveau projet');
    await repository.createProject(auth.userId, project);
    return serializeProject(project);
  });
}

/**
 * Load a project by ID.
 */
export async function loadProjectAction(
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

    return serializeProject(project);
  });
}

/**
 * List all projects for current user.
 */
export async function listProjectsAction(): Promise<ActionResult<ProjectListItem[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const projects = await repository.listProjects(auth.userId);
    return projects.map(serializeProjectListItem);
  });
}

/**
 * Delete a project.
 */
export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    await repository.deleteProject(auth.userId, projectId);
    return { deleted: true };
  });
}

/**
 * Update project title.
 */
export async function updateProjectTitleAction(
  projectId: string,
  title: string
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    project.updateTitle(title);
    await repository.updateProject(auth.userId, project);
    return serializeProject(project);
  });
}
