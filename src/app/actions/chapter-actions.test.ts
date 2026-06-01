// ABOUTME: Tests for chapter Server Actions.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addChapterAction,
  removeChapterAction,
  reorderChaptersAction,
  updateChapterTitleAction,
  updateChapterContentAction,
} from './chapter-actions';

vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn(),
  getWordCountSnapshotRepo: vi.fn(async () => ({ upsertForDay: vi.fn(async (_u, s) => s) })),
  getIdGenerator: vi.fn(async () => ({ generate: () => '507f1f77bcf86cd799439011' })),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

import { getAuthenticatedUserId, getRepository } from './utils';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('chapter-actions', () => {
  let mockRepository: InMemoryProjectRepository;
  let testProject: Project;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRepository = new InMemoryProjectRepository();
    vi.mocked(getRepository).mockResolvedValue(mockRepository);
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    // Create test project with 2 chapters
    const chapter1 = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
    const chapter2 = new Chapter('ch-2', 'Chapter 2', '{"type":"doc","content":[]}', 1);
    testProject = Project.create('user-123', 'Test Project', [chapter1, chapter2]);
    await mockRepository.createProject('user-123', testProject);
  });

  describe('addChapterAction', () => {
    it('adds new chapter to project', async () => {
      const result = await addChapterAction(testProject.getId());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chapters).toHaveLength(3);
        expect(result.data.chapters[2].title).toBe('Chapitre 3');
      }
    });
  });

  describe('removeChapterAction', () => {
    it('removes chapter from project', async () => {
      const result = await removeChapterAction(testProject.getId(), 'ch-2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chapters).toHaveLength(1);
        expect(result.data.chapters[0].id).toBe('ch-1');
      }
    });

    it('prevents removing last chapter', async () => {
      await removeChapterAction(testProject.getId(), 'ch-2');
      const result = await removeChapterAction(testProject.getId(), 'ch-1');

      expect(result.success).toBe(false);
    });
  });

  describe('reorderChaptersAction', () => {
    it('reorders chapters', async () => {
      const result = await reorderChaptersAction(testProject.getId(), 0, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chapters[0].id).toBe('ch-2');
        expect(result.data.chapters[1].id).toBe('ch-1');
      }
    });
  });

  describe('updateChapterTitleAction', () => {
    it('updates chapter title', async () => {
      const result = await updateChapterTitleAction(
        testProject.getId(),
        'ch-1',
        'New Title'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('New Title');
      }
    });
  });

  describe('updateChapterContentAction', () => {
    it('updates chapter content', async () => {
      const newContent = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}';

      const result = await updateChapterContentAction(
        testProject.getId(),
        'ch-1',
        newContent
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.saved).toBe(true);
      }
    });
  });
});
