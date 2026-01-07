// ABOUTME: Tests for the project store with mocked server actions.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useProjectStore } from './projectStore';

// Mock server actions
vi.mock('@/app/actions/project-actions', () => ({
  createProjectAction: vi.fn(),
  loadProjectAction: vi.fn(),
}));

vi.mock('@/app/actions/chapter-actions', () => ({
  updateChapterContentAction: vi.fn(),
  addChapterAction: vi.fn(),
  removeChapterAction: vi.fn(),
  reorderChaptersAction: vi.fn(),
  updateChapterTitleAction: vi.fn(),
  setActiveChapterAction: vi.fn(),
}));

import {
  createProjectAction,
  loadProjectAction,
} from '@/app/actions/project-actions';

import {
  updateChapterContentAction,
  addChapterAction,
} from '@/app/actions/chapter-actions';

const mockProject = {
  id: 'proj-1',
  title: 'Test Project',
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter 1',
      content: '{"type":"doc","content":[]}',
      order: 0,
      metadata: { wordCount: 0, characterCount: 0, lastEdited: new Date().toISOString() },
    },
  ],
  activeChapterId: 'ch-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('projectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useProjectStore.setState({
      projectId: null,
      project: null,
      activeContent: '{"type":"doc","content":[{"type":"paragraph"}]}',
      isLoading: false,
      isSaving: false,
      isImporting: false,
      isExporting: false,
      error: null,
      hasUnsavedChanges: false,
      lastSavedAt: null,
    });
  });

  describe('loadProject', () => {
    it('loads project and sets state', async () => {
      vi.mocked(loadProjectAction).mockResolvedValue({
        success: true,
        data: mockProject,
      });

      await act(async () => {
        await useProjectStore.getState().loadProject('proj-1');
      });

      const state = useProjectStore.getState();
      expect(state.projectId).toBe('proj-1');
      expect(state.project).toEqual(mockProject);
      expect(state.isLoading).toBe(false);
    });

    it('handles load error', async () => {
      vi.mocked(loadProjectAction).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      await act(async () => {
        await useProjectStore.getState().loadProject('non-existent');
      });

      const state = useProjectStore.getState();
      expect(state.error).toBe('Not found');
      expect(state.project).toBeNull();
    });
  });

  describe('createProject', () => {
    it('creates project and returns ID', async () => {
      vi.mocked(createProjectAction).mockResolvedValue({
        success: true,
        data: mockProject,
      });

      let projectId: string | null = null;
      await act(async () => {
        projectId = await useProjectStore.getState().createProject('My Project');
      });

      expect(projectId).toBe('proj-1');
      expect(useProjectStore.getState().project).toEqual(mockProject);
    });
  });

  describe('saveCurrentChapter', () => {
    it('saves chapter content', async () => {
      vi.mocked(updateChapterContentAction).mockResolvedValue({
        success: true,
        data: { saved: true, updatedAt: new Date().toISOString() },
      });

      // Setup state with unsaved changes
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        activeContent: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"New content"}]}]}',
        hasUnsavedChanges: true,
      });

      await act(async () => {
        await useProjectStore.getState().saveCurrentChapter();
      });

      const state = useProjectStore.getState();
      expect(state.hasUnsavedChanges).toBe(false);
      expect(state.lastSavedAt).not.toBeNull();
    });

    it('does not save if no unsaved changes', async () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        hasUnsavedChanges: false,
      });

      await act(async () => {
        await useProjectStore.getState().saveCurrentChapter();
      });

      expect(updateChapterContentAction).not.toHaveBeenCalled();
    });
  });

  describe('addChapter', () => {
    it('adds chapter and switches to it', async () => {
      const projectWithNewChapter = {
        ...mockProject,
        chapters: [
          ...mockProject.chapters,
          {
            id: 'ch-2',
            title: 'Chapitre 2',
            content: '{"type":"doc","content":[]}',
            order: 1,
            metadata: { wordCount: 0, characterCount: 0, lastEdited: new Date().toISOString() },
          },
        ],
      };

      vi.mocked(addChapterAction).mockResolvedValue({
        success: true,
        data: projectWithNewChapter,
      });

      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
      });

      await act(async () => {
        await useProjectStore.getState().addChapter();
      });

      const state = useProjectStore.getState();
      expect(state.project?.chapters).toHaveLength(2);
      expect(state.project?.activeChapterId).toBe('ch-2');
    });
  });

  describe('updateActiveContent', () => {
    it('marks content as unsaved', () => {
      const newContent = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Updated"}]}]}';

      act(() => {
        useProjectStore.getState().updateActiveContent(newContent);
      });

      const state = useProjectStore.getState();
      expect(state.activeContent).toBe(newContent);
      expect(state.hasUnsavedChanges).toBe(true);
    });
  });

  describe('clearProject', () => {
    it('resets project state', () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        hasUnsavedChanges: true,
      });

      act(() => {
        useProjectStore.getState().clearProject();
      });

      const state = useProjectStore.getState();
      expect(state.projectId).toBeNull();
      expect(state.project).toBeNull();
      expect(state.hasUnsavedChanges).toBe(false);
    });
  });
});
