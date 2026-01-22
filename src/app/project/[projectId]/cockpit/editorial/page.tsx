// ABOUTME: Editorial annexes page for managing front/back matter
// ABOUTME: Displays cards for each editorial type with TipTap editing

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  listEditorialAnnexesAction,
  saveEditorialAnnexAction,
  deleteEditorialAnnexAction,
  type SerializedEditorialAnnex,
} from '@/app/actions/editorial-actions';
import { EditorialCard, EditorialEditor } from '@/components/cockpit';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, AlertCircle } from 'lucide-react';

export default function EditorialPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [annexes, setAnnexes] = useState<SerializedEditorialAnnex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAnnex, setEditingAnnex] = useState<SerializedEditorialAnnex | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listEditorialAnnexesAction(projectId);

      if (result.success) {
        setAnnexes(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (content: string) => {
    if (!editingAnnex) return;

    const result = await saveEditorialAnnexAction(projectId, editingAnnex.type, content);

    if (result.success) {
      setAnnexes((prev) =>
        prev.map((a) => (a.type === editingAnnex.type ? result.data : a))
      );
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!editingAnnex) return;

    const result = await deleteEditorialAnnexAction(projectId, editingAnnex.type);

    if (result.success) {
      setAnnexes((prev) =>
        prev.map((a) =>
          a.type === editingAnnex.type
            ? { ...a, content: null, hasContent: false, id: '', updatedAt: null }
            : a
        )
      );
    } else {
      throw new Error(result.error);
    }
  };

  const completedCount = annexes.filter((a) => a.hasContent).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Annexes éditoriales</h1>
          <p className="text-muted-foreground">
            Liminaires, préface, remerciements...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Annexes éditoriales</h1>
          <p className="text-muted-foreground">
            Liminaires, préface, remerciements...
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Annexes éditoriales</h1>
          <p className="text-muted-foreground">
            Liminaires, préface, remerciements...
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm">
            {completedCount} / {annexes.length} rédigés
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {annexes.map((annex) => (
          <EditorialCard
            key={annex.type}
            annex={annex}
            onEdit={setEditingAnnex}
          />
        ))}
      </div>

      <EditorialEditor
        annex={editingAnnex}
        open={!!editingAnnex}
        onOpenChange={(open) => !open && setEditingAnnex(null)}
        onSave={handleSave}
        onDelete={editingAnnex?.hasContent ? handleDelete : undefined}
      />
    </div>
  );
}
