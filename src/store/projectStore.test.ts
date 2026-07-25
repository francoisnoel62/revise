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

vi.mock('@/app/actions/snapshot-actions', () => ({
  createSnapshotAction: vi.fn(),
}));

import {
  createProjectAction,
  loadProjectAction,
} from '@/app/actions/project-actions';

import {
  updateChapterContentAction,
  addChapterAction,
} from '@/app/actions/chapter-actions';

import { createSnapshotAction, type SerializedSnapshot } from '@/app/actions/snapshot-actions';
import type { ActionResult } from '@/app/actions/utils';

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
  providerId: null,
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

    it('returns true when there are no unsaved changes to save', async () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        hasUnsavedChanges: false,
      });

      let result: boolean | undefined;
      await act(async () => {
        result = await useProjectStore.getState().saveCurrentChapter();
      });

      expect(result).toBe(true);
    });

    it('returns true after a successful save', async () => {
      vi.mocked(updateChapterContentAction).mockResolvedValue({
        success: true,
        data: { saved: true, updatedAt: new Date().toISOString() },
      });

      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        activeContent: '{"type":"doc","content":[]}',
        hasUnsavedChanges: true,
      });

      let result: boolean | undefined;
      await act(async () => {
        result = await useProjectStore.getState().saveCurrentChapter();
      });

      expect(result).toBe(true);
    });

    it('returns false when the save fails, leaving hasUnsavedChanges true', async () => {
      vi.mocked(updateChapterContentAction).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        activeContent: '{"type":"doc","content":[]}',
        hasUnsavedChanges: true,
      });

      let result: boolean | undefined;
      await act(async () => {
        result = await useProjectStore.getState().saveCurrentChapter();
      });

      expect(result).toBe(false);
      expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
    });
  });

  describe('createSnapshot', () => {
    it('creates a snapshot directly when there are no unsaved changes', async () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        hasUnsavedChanges: false,
      });
      vi.mocked(createSnapshotAction).mockResolvedValue({
        success: true,
        data: {
          id: 'snap-1',
          projectId: 'proj-1',
          number: 1,
          type: 'manual',
          title: 'Version 1',
          comment: null,
          authorId: 'user-1',
          chapterCount: 1,
          createdAt: new Date().toISOString(),
        },
      });

      let result: ActionResult<SerializedSnapshot> | undefined;
      await act(async () => {
        result = await useProjectStore.getState().createSnapshot('Version 1');
      });

      expect(updateChapterContentAction).not.toHaveBeenCalled();
      expect(createSnapshotAction).toHaveBeenCalledWith('proj-1', 'Version 1', undefined);
      expect(result!.success).toBe(true);
    });

    it('flushes unsaved changes before creating a snapshot', async () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        activeContent: '{"type":"doc","content":[]}',
        hasUnsavedChanges: true,
      });
      vi.mocked(updateChapterContentAction).mockResolvedValue({
        success: true,
        data: { saved: true, updatedAt: new Date().toISOString() },
      });
      vi.mocked(createSnapshotAction).mockResolvedValue({
        success: true,
        data: {
          id: 'snap-1',
          projectId: 'proj-1',
          number: 1,
          type: 'manual',
          title: 'Version 1',
          comment: 'Un jalon',
          authorId: 'user-1',
          chapterCount: 1,
          createdAt: new Date().toISOString(),
        },
      });

      await act(async () => {
        await useProjectStore.getState().createSnapshot('Version 1', 'Un jalon');
      });

      expect(updateChapterContentAction).toHaveBeenCalled();
      expect(createSnapshotAction).toHaveBeenCalledWith('proj-1', 'Version 1', 'Un jalon');
    });

    it('fails clearly and never creates a snapshot when the forced save fails', async () => {
      useProjectStore.setState({
        projectId: 'proj-1',
        project: mockProject,
        activeContent: '{"type":"doc","content":[]}',
        hasUnsavedChanges: true,
      });
      vi.mocked(updateChapterContentAction).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      let result: ActionResult<SerializedSnapshot> | undefined;
      await act(async () => {
        result = await useProjectStore.getState().createSnapshot('Version 1');
      });

      expect(createSnapshotAction).not.toHaveBeenCalled();
      expect(result!.success).toBe(false);
      if (!result!.success) {
        expect(result!.error).toMatch(/sauvegarde a échoué/i);
      }
    });

    it('returns an error when no project is loaded', async () => {
      useProjectStore.setState({ projectId: null, project: null });

      let result: ActionResult<SerializedSnapshot> | undefined;
      await act(async () => {
        result = await useProjectStore.getState().createSnapshot('Version 1');
      });

      expect(createSnapshotAction).not.toHaveBeenCalled();
      expect(result!.success).toBe(false);
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
