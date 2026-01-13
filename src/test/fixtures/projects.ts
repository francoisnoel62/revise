// ABOUTME: Project and Chapter factory functions for test data creation.
// ABOUTME: Provides builders with sensible defaults and easy customization.

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { createSimpleDocument, createFictionChapter, stringify } from './tiptap';

/**
 * Default test user ID for consistent testing.
 */
export const TEST_USER_ID = 'test-user-123';

/**
 * Create a Chapter with sensible defaults.
 */
export function createTestChapter(overrides?: {
  id?: string;
  title?: string;
  content?: string;
  order?: number;
}): Chapter {
  const defaults = {
    id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'Test Chapter',
    content: stringify(createSimpleDocument('This is test content for the chapter.')),
    order: 0,
  };

  const { id, title, content, order } = { ...defaults, ...overrides };
  return new Chapter(id, title, content, order);
}

/**
 * Create multiple chapters for testing.
 */
export function createTestChapters(count: number, titlePrefix = 'Chapter'): Chapter[] {
  return Array.from({ length: count }, (_, i) =>
    createTestChapter({
      id: `chapter-${i + 1}`,
      title: `${titlePrefix} ${i + 1}`,
      order: i,
    })
  );
}

/**
 * Create a Project with sensible defaults.
 */
export function createTestProject(overrides?: {
  id?: string;
  ownerId?: string;
  title?: string;
  chapters?: Chapter[];
  providerId?: string | null;
}): Project {
  const defaults = {
    ownerId: TEST_USER_ID,
    title: 'Test Project',
    chapters: [createTestChapter()],
  };

  const { ownerId, title, chapters, providerId } = { ...defaults, ...overrides };
  const project = Project.create(ownerId, title, chapters);

  if (providerId !== undefined) {
    project.setProviderId(providerId);
  }

  return project;
}

/**
 * Create a Project with multiple chapters.
 */
export function createTestProjectWithChapters(
  chapterCount: number,
  overrides?: {
    ownerId?: string;
    title?: string;
    providerId?: string | null;
  }
): Project {
  return createTestProject({
    ...overrides,
    chapters: createTestChapters(chapterCount),
  });
}

/**
 * Create a realistic fiction project for testing.
 */
export function createFictionProject(options?: {
  ownerId?: string;
  title?: string;
  chapterCount?: number;
  wordsPerChapter?: number;
}): Project {
  const {
    ownerId = TEST_USER_ID,
    title = 'Mon Roman',
    chapterCount = 3,
    wordsPerChapter = 500,
  } = options || {};

  const chapters = Array.from({ length: chapterCount }, (_, i) =>
    new Chapter(
      `chapter-${i + 1}`,
      `Chapitre ${i + 1}`,
      stringify(createFictionChapter(`Chapitre ${i + 1}`, wordsPerChapter)),
      i
    )
  );

  return Project.create(ownerId, title, chapters);
}

/**
 * Create a large project for performance testing.
 * @param chapterCount Number of chapters (default: 10)
 * @param wordsPerChapter Words per chapter (default: 5000)
 */
export function createLargeProject(
  chapterCount = 10,
  wordsPerChapter = 5000
): Project {
  return createFictionProject({
    title: 'Large Test Project',
    chapterCount,
    wordsPerChapter,
  });
}

/**
 * Serialize a Project for use in component tests (store format).
 */
export function serializeProject(project: Project): {
  id: string;
  title: string;
  activeChapterId: string | null;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    metadata: { wordCount: number; characterCount: number };
  }>;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: project.getId(),
    title: project.getTitle(),
    activeChapterId: project.getActiveChapterId(),
    chapters: project.getChapters().map(ch => ({
      id: ch.getId(),
      title: ch.getTitle(),
      content: ch.getContent(),
      order: ch.getOrder(),
      metadata: ch.getMetadata(),
    })),
    providerId: project.getProviderId(),
    createdAt: project.getCreatedAt().toISOString(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}
