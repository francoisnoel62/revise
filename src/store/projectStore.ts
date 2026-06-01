// ABOUTME: Zustand store for project state management.
// ABOUTME: All mutations go through Server Actions for persistence.

import { create } from 'zustand';
import { ProjectState, SerializedProject } from './types';
import { createProjectAction, loadProjectAction } from '@/app/actions/project-actions';
import {
  updateChapterContentAction,
  addChapterAction,
  removeChapterAction,
  reorderChaptersAction,
  updateChapterTitleAction,
  setActiveChapterAction,
} from '@/app/actions/chapter-actions';

/**
 * Default empty TipTap document.
 */
const EMPTY_CONTENT = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

/**
 * Extract active chapter content from project.
 */
function getActiveContent(project: SerializedProject | null): string {
  if (!project || !project.activeChapterId) return EMPTY_CONTENT;
  const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
  return activeChapter?.content ?? EMPTY_CONTENT;
}

/**
 * Project store with server-backed persistence.
 */
export const useProjectStore = create<ProjectState>((set, get) => ({
  // === Initial State ===
  projectId: null,
  project: null,
  activeContent: EMPTY_CONTENT,
  isLoading: false,
  isSaving: false,
  isExporting: false,
  error: null,
  hasUnsavedChanges: false,
  lastSavedAt: null,

  // === Project Lifecycle ===

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });

    const result = await loadProjectAction(projectId);

    if (!result.success) {
      set({
        isLoading: false,
        error: result.error,
        // Redirect handled by caller if result.redirect exists
      });
      return;
    }

    set({
      projectId,
      project: result.data,
      activeContent: getActiveContent(result.data),
      isLoading: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(result.data.updatedAt),
    });
  },

  createProject: async (title?: string) => {
    set({ isLoading: true, error: null });

    const result = await createProjectAction(title);

    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return null;
    }

    set({
      projectId: result.data.id,
      project: result.data,
      activeContent: getActiveContent(result.data),
      isLoading: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
    });

    return result.data.id;
  },

  clearProject: () => {
    set({
      projectId: null,
      project: null,
      activeContent: EMPTY_CONTENT,
      hasUnsavedChanges: false,
      error: null,
    });
  },

  // === Chapter Operations ===

  setActiveChapter: async (chapterId: string) => {
    const { projectId, project, activeContent, hasUnsavedChanges } = get();
    if (!projectId || !project) return;

    // Don't switch if already active
    if (project.activeChapterId === chapterId) return;

    set({ isSaving: true });

    const result = await setActiveChapterAction(
      projectId,
      chapterId,
      hasUnsavedChanges ? project.activeChapterId : null,
      hasUnsavedChanges ? activeContent : null
    );

    if (!result.success) {
      set({ isSaving: false, error: result.error });
      return;
    }

    set({
      project: result.data,
      activeContent: getActiveContent(result.data),
      isSaving: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
    });
  },

  addChapter: async () => {
    const { projectId } = get();
    if (!projectId) return;

    set({ isSaving: true });

    const result = await addChapterAction(projectId);

    if (!result.success) {
      set({ isSaving: false, error: result.error });
      return;
    }

    // New chapter is last in array, set it as active
    const newProject = result.data;
    const newChapter = newProject.chapters[newProject.chapters.length - 1];

    set({
      project: {
        ...newProject,
        activeChapterId: newChapter.id,
      },
      activeContent: newChapter.content,
      isSaving: false,
      hasUnsavedChanges: false,
    });
  },

  removeChapter: async (chapterId: string) => {
    const { projectId, project } = get();
    if (!projectId || !project) return;

    // Prevent removing last chapter
    if (project.chapters.length <= 1) {
      set({ error: 'Cannot remove the last chapter' });
      return;
    }

    set({ isSaving: true });

    const result = await removeChapterAction(projectId, chapterId);

    if (!result.success) {
      set({ isSaving: false, error: result.error });
      return;
    }

    set({
      project: result.data,
      activeContent: getActiveContent(result.data),
      isSaving: false,
      hasUnsavedChanges: false,
    });
  },

  reorderChapters: async (fromIndex: number, toIndex: number) => {
    const { projectId, project } = get();
    if (!projectId || !project) return;

    // Optimistic update for smooth drag-drop
    const optimisticChapters = [...project.chapters];
    const [moved] = optimisticChapters.splice(fromIndex, 1);
    optimisticChapters.splice(toIndex, 0, moved);

    // Update order property
    optimisticChapters.forEach((ch, idx) => {
      ch.order = idx;
    });

    set({
      project: { ...project, chapters: optimisticChapters },
      isSaving: true,
    });

    const result = await reorderChaptersAction(projectId, fromIndex, toIndex);

    if (!result.success) {
      // Revert optimistic update
      set({
        project,
        isSaving: false,
        error: result.error,
      });
      return;
    }

    set({
      project: result.data,
      isSaving: false,
    });
  },

  updateChapterTitle: async (chapterId: string, title: string) => {
    const { projectId, project } = get();
    if (!projectId || !project) return;

    // Optimistic update
    const optimisticProject = {
      ...project,
      chapters: project.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, title } : ch
      ),
    };

    set({ project: optimisticProject, isSaving: true });

    const result = await updateChapterTitleAction(projectId, chapterId, title);

    if (!result.success) {
      // Revert on error
      set({ project, isSaving: false, error: result.error });
      return;
    }

    // Update with server response
    set({
      project: {
        ...project,
        chapters: project.chapters.map((ch) =>
          ch.id === chapterId ? result.data : ch
        ),
      },
      isSaving: false,
    });
  },

  // === Content Operations ===

  updateActiveContent: (content: string) => {
    set({
      activeContent: content,
      hasUnsavedChanges: true,
    });
  },

  saveCurrentChapter: async () => {
    const { projectId, project, activeContent, hasUnsavedChanges } = get();

    if (!projectId || !project || !project.activeChapterId || !hasUnsavedChanges) {
      return;
    }

    set({ isSaving: true });

    const result = await updateChapterContentAction(
      projectId,
      project.activeChapterId,
      activeContent,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    if (!result.success) {
      set({ isSaving: false, error: result.error });
      return;
    }

    // Update local chapter content to match saved
    const updatedChapters = project.chapters.map((ch) =>
      ch.id === project.activeChapterId
        ? { ...ch, content: activeContent }
        : ch
    );

    set({
      project: { ...project, chapters: updatedChapters },
      isSaving: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(result.data.updatedAt),
    });
  },

  // === UI State ===

  setIsExporting: (isExporting: boolean) => set({ isExporting }),
  clearError: () => set({ error: null }),

  // === Correction History Cache ===

  correctionHistoryCache: new Map(),

  getCorrectionHistoryCache: (chapterId: string) => {
    const cache = get().correctionHistoryCache.get(chapterId);
    if (!cache) return null;
    return cache.data;
  },

  setCorrectionHistoryCache: (chapterId: string, data) => {
    const newCache = new Map(get().correctionHistoryCache);
    newCache.set(chapterId, { data, timestamp: Date.now() });
    set({ correctionHistoryCache: newCache });
  },

  invalidateCorrectionHistoryCache: (chapterId: string) => {
    const newCache = new Map(get().correctionHistoryCache);
    newCache.delete(chapterId);
    set({ correctionHistoryCache: newCache });
  },
}));
