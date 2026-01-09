// ABOUTME: Type definitions for the project store.
// ABOUTME: Uses serialized data structures compatible with Server Actions.

import { SerializedProject, SerializedChapter, ProjectListItem } from '@/app/actions/project-actions';

export type { SerializedProject, SerializedChapter, ProjectListItem };

/**
 * Store state for project management.
 */
export interface ProjectState {
  // === Project Data ===
  /** Current project ID (null if no project loaded) */
  projectId: string | null;
  /** Current project data (serialized, not domain entity) */
  project: SerializedProject | null;
  /** Active chapter content for editor */
  activeContent: string;

  // === UI State ===
  /** General loading state (initial load) */
  isLoading: boolean;
  /** Saving in progress */
  isSaving: boolean;
  /** Import in progress */
  isImporting: boolean;
  /** Export in progress */
  isExporting: boolean;
  /** Current error message */
  error: string | null;
  /** Unsaved changes in editor */
  hasUnsavedChanges: boolean;
  /** Last successful save timestamp */
  lastSavedAt: Date | null;

  // === Actions ===
  // Project lifecycle
  loadProject: (projectId: string) => Promise<void>;
  createProject: (title?: string) => Promise<string | null>;
  clearProject: () => void;

  // Chapter operations
  setActiveChapter: (chapterId: string) => Promise<void>;
  addChapter: () => Promise<void>;
  removeChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (fromIndex: number, toIndex: number) => Promise<void>;
  updateChapterTitle: (chapterId: string, title: string) => Promise<void>;

  // Content operations
  updateActiveContent: (content: string) => void;
  saveCurrentChapter: () => Promise<void>;

  // UI state management
  setIsImporting: (isImporting: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  clearError: () => void;
}
