// ABOUTME: Type definitions for the project store.
// ABOUTME: Uses serialized data structures compatible with Server Actions.

import { SerializedProject, SerializedChapter, ProjectListItem } from '@/app/actions/project-actions';
import { CorrectionHistoryListItem } from '@/app/actions/correction-history-actions';
import { SerializedSnapshot, SerializedRestoreResult } from '@/app/actions/snapshot-actions';
import { ActionResult } from '@/app/actions/utils';

export type { SerializedProject, SerializedChapter, ProjectListItem };

/**
 * Cache entry for correction history.
 */
export interface CorrectionHistoryCacheEntry {
  data: CorrectionHistoryListItem[];
  timestamp: number;
}

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
  /** Flushes unsaved editor content. Returns false if the save failed. */
  saveCurrentChapter: () => Promise<boolean>;
  /** Flushes unsaved content first; fails clearly without creating a snapshot if that save fails. */
  createSnapshot: (title: string, comment?: string) => Promise<ActionResult<SerializedSnapshot>>;
  /** Restores the project to a past snapshot. Fails with a reload prompt on concurrent modification. */
  restoreSnapshot: (snapshotId: string) => Promise<ActionResult<SerializedRestoreResult>>;

  // UI state management
  setIsExporting: (isExporting: boolean) => void;
  clearError: () => void;

  // Correction history cache
  /** Cache of correction history per chapter */
  correctionHistoryCache: Map<string, CorrectionHistoryCacheEntry>;
  /** Get cached history for a chapter (returns null if not cached or stale) */
  getCorrectionHistoryCache: (chapterId: string) => CorrectionHistoryListItem[] | null;
  /** Set cached history for a chapter */
  setCorrectionHistoryCache: (chapterId: string, data: CorrectionHistoryListItem[]) => void;
  /** Invalidate cache for a chapter (called after new correction saved) */
  invalidateCorrectionHistoryCache: (chapterId: string) => void;
}
