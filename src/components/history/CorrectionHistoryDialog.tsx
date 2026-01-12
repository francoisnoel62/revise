// ABOUTME: Dialog component for viewing correction history of a specific chapter
// ABOUTME: Fetches and displays history in a searchable table

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CorrectionHistoryTable } from './CorrectionHistoryTable';
import {
  listCorrectionHistoryByChapterAction,
  deleteCorrectionHistoryAction,
  type CorrectionHistoryListItem,
} from '@/app/actions/correction-history-actions';

interface CorrectionHistoryDialogProps {
  projectId: string;
  chapterId: string;
  chapterTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CorrectionHistoryDialog({
  projectId,
  chapterId,
  chapterTitle,
  open,
  onOpenChange,
}: CorrectionHistoryDialogProps) {
  const [history, setHistory] = useState<CorrectionHistoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!projectId || !chapterId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await listCorrectionHistoryByChapterAction(projectId, chapterId);

      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, chapterId]);

  // Load history when dialog opens
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  const handleDelete = async (historyId: string) => {
    setDeletingId(historyId);

    try {
      const result = await deleteCorrectionHistoryAction(historyId);

      if (result.success) {
        // Remove from local state
        setHistory((prev) => prev.filter((h) => h.id !== historyId));
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (err) {
      alert('Erreur lors de la suppression');
      console.error('Failed to delete history:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Historique des corrections - {chapterTitle}</DialogTitle>
          <DialogDescription>
            Propositions de réécriture générées par l&apos;IA pour ce chapitre
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-destructive">{error}</div>
          </div>
        ) : (
          <CorrectionHistoryTable
            data={history}
            onDelete={handleDelete}
            isDeleting={deletingId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
