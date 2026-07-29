// ABOUTME: Dialog for creating, consulting, editing, deleting, and restoring a project's snapshot history
// ABOUTME: Delegates editor-state mutations to the project store and history governance to server actions

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
import {
  listSnapshotsAction,
  updateSnapshotMetadataAction,
  deleteSnapshotAction,
  type SerializedSnapshot,
  type SnapshotHistoryFilters,
} from '@/app/actions/snapshot-actions';
import { useProjectStore } from '@/store/projectStore';
import type { SnapshotType } from '@/domain/value-objects/SnapshotType';
import { SnapshotComparisonDialog } from './SnapshotComparisonDialog';

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

  const [restoreTarget, setRestoreTarget] = useState<SerializedSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [highlightedSnapshotId, setHighlightedSnapshotId] = useState<string | null>(null);
  const [comparisonTarget, setComparisonTarget] = useState<SerializedSnapshot | null>(null);
  const [historyFilters, setHistoryFilters] = useState<SnapshotHistoryFilters>({});
  const [nextBeforeNumber, setNextBeforeNumber] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<SerializedSnapshot | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SerializedSnapshot | null>(null);

  const createSnapshot = useProjectStore((s) => s.createSnapshot);
  const restoreSnapshot = useProjectStore((s) => s.restoreSnapshot);
  const loadProject = useProjectStore((s) => s.loadProject);
  const currentChapters = useProjectStore((s) => s.project?.chapters ?? []);

  const loadHistory = useCallback(async (filters?: SnapshotHistoryFilters, append = false) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    const hasFilters = filters && Object.values(filters).some((value) => value !== undefined && value !== '');
    const result = hasFilters
      ? await listSnapshotsAction(projectId, filters)
      : await listSnapshotsAction(projectId);

    if (result.success) {
      setSnapshots((previous) => append ? [...previous, ...result.data.snapshots] : result.data.snapshots);
      setHasUnsnapshottedChanges(result.data.hasUnsnapshottedChanges);
      setNextBeforeNumber(result.data.nextBeforeNumber);
      if (!append) setTitle(`Version ${(result.data.snapshots[0]?.number ?? 0) + 1}`);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) {
      loadHistory();
    } else {
      setRestoreTarget(null);
      setRestoreError(null);
      setHighlightedSnapshotId(null);
      setComparisonTarget(null);
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

  // Preview only — RestoreSnapshotUseCase is the source of truth for actual number allocation.
  const nextVersionNumber = (snapshots[0]?.number ?? 0) + 1;

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;

    setIsRestoring(true);
    setRestoreError(null);

    const result = await restoreSnapshot(restoreTarget.id);

    if (!result.success) {
      setRestoreError(result.error);
      setIsRestoring(false);
      return;
    }

    setIsRestoring(false);
    setRestoreTarget(null);
    setHighlightedSnapshotId(result.data.restoreSnapshot.id);
    await loadHistory();
  };

  const handleReloadAfterConflict = async () => {
    await loadProject(projectId);
    setRestoreTarget(null);
    setRestoreError(null);
    await loadHistory();
  };

  const handleApplyFilters = async () => {
    await loadHistory(historyFilters);
  };

  const handleLoadMore = async () => {
    if (!nextBeforeNumber) return;
    await loadHistory({ ...historyFilters, beforeNumber: nextBeforeNumber }, true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const result = await updateSnapshotMetadataAction(projectId, editTarget.id, editTitle, editComment);
    if (!result.success) { setError(result.error); return; }
    setSnapshots((items) => items.map((item) => item.id === result.data.id ? result.data : item));
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteSnapshotAction(projectId, deleteTarget.id);
    if (!result.success) { setError(result.error); return; }
    setSnapshots((items) => items.map((item) => item.id === result.data.id ? result.data : item));
    setDeleteTarget(null);
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
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-4">
                <select
                  aria-label="Type de version"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={historyFilters.type ?? ''}
                  onChange={(event) => setHistoryFilters((filters) => ({ ...filters, type: event.target.value as SnapshotType || undefined }))}
                >
                  <option value="">Tous les types</option>
                  {Object.entries(SNAPSHOT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Input aria-label="Auteur de la version" placeholder="Auteur" value={historyFilters.authorId ?? ''} onChange={(event) => setHistoryFilters((filters) => ({ ...filters, authorId: event.target.value || undefined }))} />
                <Input aria-label="À partir du" type="date" value={historyFilters.from ?? ''} onChange={(event) => setHistoryFilters((filters) => ({ ...filters, from: event.target.value || undefined }))} />
                <div className="flex gap-2"><Input aria-label="Jusqu’au" type="date" value={historyFilters.to ?? ''} onChange={(event) => setHistoryFilters((filters) => ({ ...filters, to: event.target.value || undefined }))} /><Button variant="outline" size="sm" onClick={handleApplyFilters}>Filtrer</Button></div>
              </div>
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
                    <div
                      key={snapshot.id}
                      data-testid={`snapshot-row-${snapshot.id}`}
                      className={
                        snapshot.id === highlightedSnapshotId
                          ? 'p-4 bg-primary/10 ring-1 ring-primary/40'
                          : 'p-4'
                      }
                    >
                      {/** A restoration keeps its number-only provenance even if its source was tombstoned. */}
                      {(() => {
                        const sourceDeleted = snapshot.sourceSnapshotNumber != null
                          && snapshots.some((candidate) => candidate.number === snapshot.sourceSnapshotNumber && candidate.isDeleted);
                        return <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">v{snapshot.number}</Badge>
                        <span className="font-medium">{snapshot.title}</span>
                        <Badge variant="outline">
                          {SNAPSHOT_TYPE_LABELS[snapshot.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(snapshot.createdAt)}
                        </span>
                        {snapshot.isDeleted ? <Badge variant="destructive">Supprimée</Badge> : <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => setRestoreTarget(snapshot)}
                        >
                          Restaurer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setComparisonTarget(snapshot)}
                        >
                          Prévisualiser et comparer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditTarget(snapshot); setEditTitle(snapshot.title); setEditComment(snapshot.comment ?? ''); }}>
                          Modifier
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(snapshot)}>
                          Supprimer
                        </Button>
                        </>}
                      </div>
                      {snapshot.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{snapshot.comment}</p>
                      )}
                      {snapshot.sourceSnapshotNumber != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Restaurée depuis la version {snapshot.sourceSnapshotNumber}{sourceDeleted ? ' supprimée' : ''}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Auteur : {snapshot.authorId}</p>
                      {snapshot.isDeleted && <p className="text-sm text-muted-foreground mt-1">Entrée d’audit : son contenu a été supprimé définitivement.</p>}
                        </>;
                      })()}
                    </div>
                  ))
                )}
                </div>
              </ScrollArea>
              {nextBeforeNumber && <Button variant="outline" className="w-full" onClick={handleLoadMore}>Charger les versions suivantes</Button>}
            </div>
          )}
        </div>
      </DialogContent>

      <Dialog
        open={restoreTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setRestoreTarget(null);
            setRestoreError(null);
          }
        }}
      >
        <DialogContent>
          {restoreTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Restaurer la version {restoreTarget.number}</DialogTitle>
                <DialogDescription>
                  {restoreTarget.title} · {formatDate(restoreTarget.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Aucune version existante ne sera supprimée.
                </p>

                {hasUnsnapshottedChanges ? (
                  <p>
                    Vos modifications non enregistrées seront conservées sous la version{' '}
                    <strong>v{nextVersionNumber}</strong> (« Sécurité avant restauration »), puis
                    la version <strong>v{nextVersionNumber + 1}</strong> restaurera le contenu de
                    la version {restoreTarget.number}.
                  </p>
                ) : (
                  <p>
                    Cette restauration créera la version <strong>v{nextVersionNumber}</strong>.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-medium mb-1">Structure actuelle</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {currentChapters.map((chapter) => (
                        <li key={chapter.id}>{chapter.title}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Après restauration</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {restoreTarget.chapterTitles.map((chapterTitle, index) => (
                        <li key={`${chapterTitle}-${index}`}>{chapterTitle}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {restoreError && (
                  <div className="space-y-2">
                    <p className="text-destructive">{restoreError}</p>
                    <Button variant="outline" size="sm" onClick={handleReloadAfterConflict}>
                      Recharger le projet
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRestoreTarget(null);
                    setRestoreError(null);
                  }}
                  disabled={isRestoring}
                >
                  Annuler
                </Button>
                <Button onClick={handleConfirmRestore} disabled={isRestoring}>
                  {isRestoring ? 'Restauration...' : 'Confirmer la restauration'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SnapshotComparisonDialog
        projectId={projectId}
        snapshotId={comparisonTarget?.id ?? null}
        open={comparisonTarget !== null}
        onOpenChange={(next) => !next && setComparisonTarget(null)}
      />

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le snapshot</DialogTitle><DialogDescription>Le contenu capturé ne peut pas être modifié.</DialogDescription></DialogHeader>
          <Label htmlFor="edit-snapshot-title">Titre</Label>
          <Input id="edit-snapshot-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
          <Label htmlFor="edit-snapshot-comment">Commentaire</Label>
          <Textarea id="edit-snapshot-comment" value={editComment} onChange={(event) => setEditComment(event.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditTarget(null)}>Annuler</Button><Button onClick={handleEdit} disabled={!editTitle.trim()}>Enregistrer</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer définitivement ce snapshot ?</DialogTitle><DialogDescription>Le contenu de v{deleteTarget?.number} ne pourra plus être prévisualisé ni restauré. Son numéro restera dans la chronologie à titre d’audit.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button><Button variant="destructive" onClick={handleDelete}>Confirmer la suppression</Button></div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
