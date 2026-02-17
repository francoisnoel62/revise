// ABOUTME: Zustand store for AI request visualization panel state
// ABOUTME: Manages panel visibility, active request record, and project history list

import { create } from 'zustand';
import {
  SerializedRequestRecord,
  getRequestVisualizationAction,
  listRequestHistoryAction,
} from '@/app/actions/request-visualization-actions';

export interface RequestVisualizationState {
  isOpen: boolean;
  isAdvancedView: boolean;
  activeRecord: SerializedRequestRecord | null;
  history: SerializedRequestRecord[];
  isLoadingRecord: boolean;
  isLoadingHistory: boolean;
  error: string | null;

  openPanel: (recordId: string) => Promise<void>;
  closePanel: () => void;
  toggleAdvancedView: () => void;
  loadHistory: (projectId: string) => Promise<void>;
  selectRecord: (record: SerializedRequestRecord) => void;
}

export const useRequestVisualizationStore = create<RequestVisualizationState>((set) => ({
  isOpen: false,
  isAdvancedView: false,
  activeRecord: null,
  history: [],
  isLoadingRecord: false,
  isLoadingHistory: false,
  error: null,

  openPanel: async (recordId: string) => {
    set({ isOpen: true, isLoadingRecord: true, error: null });
    try {
      const result = await getRequestVisualizationAction(recordId);
      if (result.success) {
        set({ activeRecord: result.data, isLoadingRecord: false });
      } else {
        set({ error: result.error, isLoadingRecord: false });
      }
    } catch {
      set({ error: 'Failed to load request details', isLoadingRecord: false });
    }
  },

  closePanel: () => {
    set({ isOpen: false });
  },

  toggleAdvancedView: () => {
    set((state) => ({ isAdvancedView: !state.isAdvancedView }));
  },

  loadHistory: async (projectId: string) => {
    set({ isLoadingHistory: true, error: null });
    try {
      const result = await listRequestHistoryAction(projectId);
      if (result.success) {
        set({ history: result.data, isLoadingHistory: false });
      } else {
        set({ error: result.error, isLoadingHistory: false });
      }
    } catch {
      set({ error: 'Failed to load request history', isLoadingHistory: false });
    }
  },

  selectRecord: (record: SerializedRequestRecord) => {
    set({ activeRecord: record });
  },
}));
