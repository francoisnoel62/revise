// ABOUTME: Visual indicator for save status.
// ABOUTME: Shows saving, saved, or unsaved state.

'use client';

import { useProjectStore } from '@/store/projectStore';

export function SaveStatus() {
  const { hasUnsavedChanges, isSaving, lastSavedAt, error } = useProjectStore();

  if (error) {
    return (
      <span className="text-xs text-red-600">
        Erreur : {error}
      </span>
    );
  }

  if (isSaving) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Enregistrement...
      </span>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <span className="text-xs text-amber-600">
        Modifications non enregistrées
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="text-xs text-muted-foreground">
        Enregistré {formatRelativeTime(lastSavedAt)}
      </span>
    );
  }

  return null;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'à l\'instant';
  if (seconds < 60) return `il y a ${seconds}s`;
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
  return date.toLocaleTimeString('fr-FR');
}
