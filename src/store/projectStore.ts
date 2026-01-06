// ABOUTME: Zustand store for centralized project and chapter state management
// ABOUTME: Delegates business logic to application use cases

import { create } from 'zustand';
import { Project } from '@/domain/entities/Project';
import { SwitchChapterUseCase } from '@/application/use-cases/SwitchChapterUseCase';
import { AddChapterUseCase } from '@/application/use-cases/AddChapterUseCase';
import { RemoveChapterUseCase } from '@/application/use-cases/RemoveChapterUseCase';
import { ReorderChaptersUseCase } from '@/application/use-cases/ReorderChaptersUseCase';
import { UpdateChapterContentUseCase } from '@/application/use-cases/UpdateChapterContentUseCase';
import { UpdateChapterTitleUseCase } from '@/application/use-cases/UpdateChapterTitleUseCase';

interface ProjectState {
  // Core state
  project: Project;
  activeContent: string; // Current editor content (TipTap JSON)
  hasUnsavedChanges: boolean;

  // UI state
  isImporting: boolean;
  isExporting: boolean;

  // Use case instances (client-side only - no server dependencies)
  switchChapterUseCase: SwitchChapterUseCase;
  addChapterUseCase: AddChapterUseCase;
  removeChapterUseCase: RemoveChapterUseCase;
  reorderChaptersUseCase: ReorderChaptersUseCase;
  updateChapterContentUseCase: UpdateChapterContentUseCase;
  updateChapterTitleUseCase: UpdateChapterTitleUseCase;

  // Actions
  setProject: (project: Project) => void;
  setActiveChapter: (chapterId: string) => void;
  updateActiveContent: (content: string) => void;
  saveCurrentChapter: () => void;
  addChapter: () => void;
  removeChapter: (chapterId: string) => void;
  reorderChapters: (fromIndex: number, toIndex: number) => void;
  updateChapterTitle: (chapterId: string, title: string) => void;
  setIsImporting: (isImporting: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  project: new Project(),
  activeContent: JSON.stringify({ type: 'doc', content: [] }),
  hasUnsavedChanges: false,
  isImporting: false,
  isExporting: false,

  // Use cases (client-side only)
  switchChapterUseCase: new SwitchChapterUseCase(),
  addChapterUseCase: new AddChapterUseCase(),
  removeChapterUseCase: new RemoveChapterUseCase(),
  reorderChaptersUseCase: new ReorderChaptersUseCase(),
  updateChapterContentUseCase: new UpdateChapterContentUseCase(),
  updateChapterTitleUseCase: new UpdateChapterTitleUseCase(),

  // Set project (after import or load)
  setProject: (project) => {
    const activeChapter = project.getActiveChapter();
    const content = activeChapter
      ? activeChapter.getContent()
      : JSON.stringify({ type: 'doc', content: [] });

    set({
      project,
      activeContent: content,
      hasUnsavedChanges: false,
    });
  },

  // Switch active chapter
  setActiveChapter: (chapterId) => {
    const state = get();

    // Save current chapter if has unsaved changes
    if (state.hasUnsavedChanges) {
      state.saveCurrentChapter();
    }

    // Switch chapter
    state.switchChapterUseCase.execute(
      state.project,
      chapterId,
      state.activeContent
    );

    const newActiveChapter = state.project.getActiveChapter();
    const newContent = newActiveChapter
      ? newActiveChapter.getContent()
      : JSON.stringify({ type: 'doc', content: [] });

    set({
      project: state.project,
      activeContent: newContent,
      hasUnsavedChanges: false,
    });
  },

  // Update active content (editor typing)
  updateActiveContent: (content) => {
    set({
      activeContent: content,
      hasUnsavedChanges: true,
    });
  },

  // Save current chapter content
  saveCurrentChapter: () => {
    const state = get();
    const activeChapter = state.project.getActiveChapter();

    if (activeChapter) {
      state.updateChapterContentUseCase.execute(
        state.project,
        activeChapter.getId(),
        state.activeContent
      );

      set({ hasUnsavedChanges: false });
    }
  },

  // Add new chapter
  addChapter: () => {
    const state = get();
    state.addChapterUseCase.execute(state.project);

    set({ project: state.project });
  },

  // Remove chapter
  removeChapter: (chapterId) => {
    const state = get();

    state.removeChapterUseCase.execute(state.project, chapterId);

    const newActiveChapter = state.project.getActiveChapter();
    const newContent = newActiveChapter
      ? newActiveChapter.getContent()
      : JSON.stringify({ type: 'doc', content: [] });

    set({
      project: state.project,
      activeContent: newContent,
      hasUnsavedChanges: false,
    });
  },

  // Reorder chapters
  reorderChapters: (fromIndex, toIndex) => {
    const state = get();
    state.reorderChaptersUseCase.execute(state.project, fromIndex, toIndex);

    set({ project: state.project });
  },

  // Update chapter title
  updateChapterTitle: (chapterId, title) => {
    const state = get();
    state.updateChapterTitleUseCase.execute(state.project, chapterId, title);

    set({ project: state.project });
  },

  // Set importing state
  setIsImporting: (isImporting) => {
    set({ isImporting });
  },

  // Set exporting state
  setIsExporting: (isExporting) => {
    set({ isExporting });
  },
}));
