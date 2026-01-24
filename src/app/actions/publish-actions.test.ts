// ABOUTME: Tests for publish Server Actions.
// ABOUTME: Validates chapter selection for publish and public reading.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the utils module
vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn(),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

// Mock config
vi.mock('@/infrastructure/config/env', () => ({
  config: {
    app: {
      baseUrl: 'https://test.app',
    },
  },
}));

import { getAuthenticatedUserId, getRepository } from './utils';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

// Import after mocks are set up
import { publishProjectAction, loadPublishedProjectAction } from './publish-actions';

describe('publish-actions', () => {
  let mockRepository: ProjectRepository;
  let testProject: Project;
  let chapter1: Chapter;
  let chapter2: Chapter;
  let chapter3: Chapter;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create chapters
    chapter1 = new Chapter('ch-1', 'Chapter 1', JSON.stringify({ type: 'doc', content: [] }), 0);
    chapter2 = new Chapter('ch-2', 'Chapter 2', JSON.stringify({ type: 'doc', content: [] }), 1);
    chapter3 = new Chapter('ch-3', 'Chapter 3', JSON.stringify({ type: 'doc', content: [] }), 2);

    // Create test project
    testProject = new Project(
      'proj-123',
      'user-123',
      'Test Project',
      [chapter1, chapter2, chapter3],
      'ch-1',
      null,
      new Date(),
      new Date()
    );

    // Mock repository
    mockRepository = {
      loadProject: vi.fn(),
      updateProject: vi.fn(),
      createProject: vi.fn(),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
      updateChapter: vi.fn(),
      deleteAllByOwner: vi.fn(),
      findPublishedByToken: vi.fn(),
    };
    vi.mocked(getRepository).mockResolvedValue(mockRepository);
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
  });

  describe('publishProjectAction with chapter selection', () => {
    it('should publish with only selected chapters', async () => {
      vi.mocked(mockRepository.loadProject).mockResolvedValue(testProject);
      vi.mocked(mockRepository.updateProject).mockImplementation(async (_userId, project) => project);

      // Publish with only chapter 1 and chapter 3 selected
      const selectedChapterIds = ['ch-1', 'ch-3'];
      const result = await publishProjectAction('proj-123', selectedChapterIds);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublished).toBe(true);
        expect(result.data.publishedChapterIds).toEqual(['ch-1', 'ch-3']);
      }

      // Verify updateProject was called with correct publishedChapterIds
      expect(mockRepository.updateProject).toHaveBeenCalled();
      const updatedProject = vi.mocked(mockRepository.updateProject).mock.calls[0][1];
      expect(updatedProject.getPublishedChapterIds()).toEqual(['ch-1', 'ch-3']);
    });

    it('should publish all chapters when chapterIds is undefined', async () => {
      vi.mocked(mockRepository.loadProject).mockResolvedValue(testProject);
      vi.mocked(mockRepository.updateProject).mockImplementation(async (_userId, project) => project);

      // Publish without chapter selection (all chapters)
      const result = await publishProjectAction('proj-123', undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublished).toBe(true);
        expect(result.data.publishedChapterIds).toBeNull();
      }

      // Verify updateProject was called with null publishedChapterIds
      const updatedProject = vi.mocked(mockRepository.updateProject).mock.calls[0][1];
      expect(updatedProject.getPublishedChapterIds()).toBeNull();
    });
  });

  describe('loadPublishedProjectAction with chapter selection', () => {
    it('should return only published chapters', async () => {
      // Simulate a project published with selected chapters
      testProject.publish(['ch-1', 'ch-3']);
      vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(testProject);

      const result = await loadPublishedProjectAction('proj-123', testProject.getShareToken()!);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only have 2 chapters (ch-1 and ch-3), not all 3
        expect(result.data.chapters).toHaveLength(2);
        expect(result.data.chapters.map(c => c.id)).toEqual(['ch-1', 'ch-3']);
      }
    });

    it('should return all chapters when publishedChapterIds is null', async () => {
      // Simulate a project published with all chapters
      testProject.publish(); // No chapter IDs = all chapters
      vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(testProject);

      const result = await loadPublishedProjectAction('proj-123', testProject.getShareToken()!);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have all 3 chapters
        expect(result.data.chapters).toHaveLength(3);
        expect(result.data.chapters.map(c => c.id)).toEqual(['ch-1', 'ch-2', 'ch-3']);
      }
    });
  });

  describe('full publish-load cycle', () => {
    it('should correctly filter chapters through publish and load cycle', async () => {
      // Set up mocks to track the project through the cycle
      let savedProject: Project | null = null;

      vi.mocked(mockRepository.loadProject).mockResolvedValue(testProject);
      vi.mocked(mockRepository.updateProject).mockImplementation(async (_userId, project) => {
        savedProject = project;
        return project;
      });

      // Step 1: Publish with selected chapters
      const selectedChapterIds = ['ch-2'];
      const publishResult = await publishProjectAction('proj-123', selectedChapterIds);

      expect(publishResult.success).toBe(true);
      expect(savedProject).not.toBeNull();
      expect(savedProject!.getPublishedChapterIds()).toEqual(['ch-2']);

      // Step 2: Load the published project
      vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(savedProject!);
      const loadResult = await loadPublishedProjectAction('proj-123', savedProject!.getShareToken()!);

      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        // Should only have 1 chapter (ch-2)
        expect(loadResult.data.chapters).toHaveLength(1);
        expect(loadResult.data.chapters[0].id).toBe('ch-2');
        expect(loadResult.data.chapters[0].title).toBe('Chapter 2');
      }
    });
  });
});
