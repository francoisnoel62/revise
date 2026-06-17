// ABOUTME: Client button that deletes pricing entries no longer present in OpenRouter.
// ABOUTME: Confirms before the destructive prune and shows how many entries were removed.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
import { prunePricingAction } from '@/app/actions/pricing-admin-actions';

export function PruneButton() {
  const router = useRouter();
  const [pruning, setPruning] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePrune() {
    setPruning(true);
    setMessage(null);
    const result = await prunePricingAction();
    setPruning(false);
    setOpen(false);
    if (result.success) {
      const { deletedKeys } = result.data;
      setMessage(
        deletedKeys.length === 0
          ? '✓ Aucune entrée obsolète'
          : `✓ ${deletedKeys.length} entrée${deletedKeys.length > 1 ? 's' : ''} supprimée${deletedKeys.length > 1 ? 's' : ''}`
      );
      router.refresh();
    } else {
      setMessage(`Erreur : ${result.error}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={pruning}>
        <Trash2 className="mr-2 h-4 w-4" />
        {pruning ? 'Purge…' : 'Purger les obsolètes'}
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}

      <AlertDialog open={open} onOpenChange={(o) => !o && !pruning && setOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purger les entrées obsolètes ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprime les tarifs dont le modèle n&apos;existe plus chez OpenRouter (anciennes
              étiquettes génériques laissées par d&apos;anciennes synchronisations). Les tarifs
              encore disponibles sont conservés. Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pruning}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePrune();
              }}
              disabled={pruning}
            >
              {pruning ? 'Purge…' : 'Purger'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
