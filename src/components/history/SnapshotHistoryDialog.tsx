// ABOUTME: Dialog for creating and consulting a project's manual snapshot history
// ABOUTME: Delegates the force-save-then-snapshot flow to the project store

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { listSnapshotsAction, type SerializedSnapshot } from '@/app/actions/snapshot-actions';
import { useProjectStore } from '@/store/projectStore';
import type { SnapshotType } from '@/domain/value-objects/SnapshotType';

interface SnapshotHistoryDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SNAPSHOT_TYPE_LABELS: Record<SnapshotType, string> = {
  manual: 'Manuel',
  automatic: 'Automatique',
  restore: 'Restauration',
  safety: 'Sécurité',
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SnapshotHistoryDialog({
  projectId,
  open,
  onOpenChange,
}: SnapshotHistoryDialogProps) {
  const [snapshots, setSnapshots] = useState<SerializedSnapshot[]>([]);
  const [hasUnsnapshottedChanges, setHasUnsnapshottedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Version 1');
  const [comment, setComment] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createSnapshot = useProjectStore((s) => s.createSnapshot);

  const loadHistory = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    const result = await listSnapshotsAction(projectId);

    if (result.success) {
      setSnapshots(result.data.snapshots);
      setHasUnsnapshottedChanges(result.data.hasUnsnapshottedChanges);
      setTitle(`Version ${(result.data.snapshots[0]?.number ?? 0) + 1}`);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const result = await createSnapshot(title, comment.trim() || undefined);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSnapshots((prev) => [result.data, ...prev]);
      setHasUnsnapshottedChanges(false);
      setTitle(`Version ${result.data.number + 1}`);
      setComment('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[85vw] !max-w-none max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historique des versions</DialogTitle>
          <DialogDescription>
            Créez un snapshot manuel du projet ou consultez les versions précédentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="snapshot-title">Titre</Label>
              <Input
                id="snapshot-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div>
              <Label htmlFor="snapshot-comment">Commentaire (facultatif)</Label>
              <Textarea
                id="snapshot-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isCreating}
                rows={1}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleCreate} disabled={isCreating || !title.trim()}>
            {isCreating ? 'Création...' : 'Créer un snapshot'}
          </Button>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : (
            <ScrollArea className="h-100 rounded-md border">
              <div className="divide-y">
                {hasUnsnapshottedChanges && (
                  <div className="p-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">État courant</Badge>
                      <span className="text-sm text-muted-foreground">
                        {snapshots.length > 0
                          ? `Modifications depuis la version ${snapshots[0].number}`
                          : 'Aucun snapshot pour ce projet'}
                      </span>
                    </div>
                  </div>
                )}

                {snapshots.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    Aucun snapshot pour ce projet
                  </div>
                ) : (
                  snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">v{snapshot.number}</Badge>
                        <span className="font-medium">{snapshot.title}</span>
                        <Badge variant="outline">
                          {SNAPSHOT_TYPE_LABELS[snapshot.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(snapshot.createdAt)}
                        </span>
                      </div>
                      {snapshot.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{snapshot.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
