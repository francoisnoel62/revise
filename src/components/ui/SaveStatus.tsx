// ABOUTME: Visual indicator for save status.
// ABOUTME: Shows saving, saved, or unsaved state.

'use client';

import { useProjectStore } from '@/store/projectStore';

export function SaveStatus() {
  const { hasUnsavedChanges, isSaving, lastSavedAt, error } = useProjectStore();

  if (error) {
    return (
      <span className="text-xs text-red-600">
        Error: {error}
      </span>
    );
  }

  if (isSaving) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Saving...
      </span>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <span className="text-xs text-amber-600">
        Unsaved changes
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="text-xs text-muted-foreground">
        Saved {formatRelativeTime(lastSavedAt)}
      </span>
    );
  }

  return null;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return date.toLocaleTimeString();
}
