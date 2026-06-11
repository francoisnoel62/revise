// ABOUTME: Admin table component for viewing and managing model pricing entries.
// ABOUTME: Displays USD/M token rates per model with edit and delete actions.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteModelPricingAction } from '@/app/actions/pricing-admin-actions';
import { ModelPricingForm } from './ModelPricingForm';
import type { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

const PROVIDER_BADGE: Record<string, { label: string; className: string }> = {
  anthropic: { label: 'Anthropic', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  openai:    { label: 'OpenAI',    className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  google:    { label: 'Google',    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
};

interface Props {
  entries: ModelPricingEntry[];
}

export function ModelPricingTable({ entries }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ModelPricingEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    await deleteModelPricingAction(deletingId);
    setDeletingId(null);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead className="text-right">Input / M</TableHead>
              <TableHead className="text-right">Output / M</TableHead>
              <TableHead className="text-right">Cache / M</TableHead>
              <TableHead>Cache dans input</TableHead>
              <TableHead>Mis à jour</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const badge = PROVIDER_BADGE[entry.provider] ?? { label: entry.provider, className: '' };
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{entry.prefix}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${entry.inputPerM.toFixed(3)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${entry.outputPerM.toFixed(3)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${entry.cachedInputPerM.toFixed(3)}</TableCell>
                  <TableCell>
                    <Badge variant={entry.cachedInInput ? 'secondary' : 'outline'}>
                      {entry.cachedInInput ? 'oui' : 'non'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.updatedAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEntry(entry)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(entry.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;entrée ne sera plus utilisée pour le calcul des coûts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingEntry && (
        <ModelPricingForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { setEditingEntry(null); router.refresh(); }}
        />
      )}
    </>
  );
}
