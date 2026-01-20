// ABOUTME: Visual indicator for save status.
// ABOUTME: Shows saving, saved, or unsaved state with responsive compact mode.

'use client';

import { useProjectStore } from '@/store/projectStore';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface SaveStatusProps {
  compact?: boolean;
}

export function SaveStatus({ compact = false }: SaveStatusProps) {
  const { hasUnsavedChanges, isSaving, lastSavedAt, error } = useProjectStore();

  if (error) {
    if (compact) {
      return (
        <span className="text-xs text-red-600 flex items-center gap-1" title={`Erreur : ${error}`}>
          <AlertCircle className="h-3 w-3" />
        </span>
      );
    }
    return (
      <span className="text-xs text-red-600">
        Erreur : {error}
      </span>
    );
  }

  if (isSaving) {
    if (compact) {
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1" title="Enregistrement...">
          <Loader2 className="h-3 w-3 animate-spin" />
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Enregistrement...
      </span>
    );
  }

  if (hasUnsavedChanges) {
    if (compact) {
      return (
        <span className="text-xs text-amber-600" title="Modifications non enregistrées">
          Non enreg.
        </span>
      );
    }
    return (
      <span className="text-xs text-amber-600">
        Modifications non enregistrées
      </span>
    );
  }

  if (lastSavedAt) {
    const relativeTime = formatRelativeTime(lastSavedAt);
    if (compact) {
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1" title={`Enregistré ${relativeTime}`}>
          <Check className="h-3 w-3 text-green-600" />
          <span>{formatCompactTime(lastSavedAt)}</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        Enregistré {relativeTime}
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

function formatCompactTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'OK';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
