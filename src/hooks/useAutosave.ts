// ABOUTME: Hook for debounced autosave of chapter content.
// ABOUTME: Saves 1 second after last keystroke.

import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';

const AUTOSAVE_DELAY = 1000; // 1 second

/**
 * Hook that triggers autosave after content changes settle.
 */
export function useAutosave() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { hasUnsavedChanges, saveCurrentChapter, isSaving } = useProjectStore();

  const triggerSave = useCallback(async () => {
    if (!isSaving) {
      await saveCurrentChapter();
    }
  }, [saveCurrentChapter, isSaving]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule save if there are unsaved changes
    if (hasUnsavedChanges) {
      timeoutRef.current = setTimeout(triggerSave, AUTOSAVE_DELAY);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, triggerSave]);

  // Save immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: { preventDefault: () => void; returnValue: string }) => {
      if (hasUnsavedChanges) {
        // Trigger synchronous save attempt
        triggerSave();
        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, triggerSave]);
}
