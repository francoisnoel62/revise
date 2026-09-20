// ABOUTME: Admin panel listing price variations quarantined by the sync (> 50% swing, not applied automatically).
// ABOUTME: Lets an admin approve (apply the new price) or reject (discard) each one.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import {
  approvePendingPriceChangeAction,
  rejectPendingPriceChangeAction,
} from '@/app/actions/pricing-admin-actions';
import type { PendingPriceChange } from '@/domain/interfaces/PendingPriceChangeRepository';

function formatUsd(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

interface Props {
  changes: PendingPriceChange[];
}

export function PendingPriceChangesPanel({ changes }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setBusyId(id);
    await approvePendingPriceChangeAction(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleReject(id: string) {
    setBusyId(id);
    await rejectPendingPriceChangeAction(id);
    setBusyId(null);
    router.refresh();
  }

  if (changes.length === 0) return null;

  return (
    <div className="mb-8 rounded-md border border-amber-300 bg-amber-50">
      <div className="border-b border-amber-300 px-4 py-3">
        <h2 className="font-semibold text-amber-900">
          Variations à valider ({changes.length})
        </h2>
        <p className="text-sm text-amber-800">
          Ces changements dépassent 50% de variation et n&apos;ont pas été appliqués
          automatiquement. Valider applique le nouveau prix, rejeter l&apos;ignore.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modèle</TableHead>
            <TableHead className="text-right">Entrée / M</TableHead>
            <TableHead className="text-right">Sortie / M</TableHead>
            <TableHead className="text-right">Cache / M</TableHead>
            <TableHead className="w-[110px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => {
            const busy = busyId === change.id;
            return (
              <TableRow key={change.id}>
                <TableCell className="font-mono text-sm">{change.key}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  ${formatUsd(change.previous.inputPerM)} → ${formatUsd(change.current.inputPerM)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  ${formatUsd(change.previous.outputPerM)} → ${formatUsd(change.current.outputPerM)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  ${formatUsd(change.previous.cachedInputPerM)} → ${formatUsd(change.current.cachedInputPerM)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      onClick={() => handleApprove(change.id)}
                      title="Valider"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      onClick={() => handleReject(change.id)}
                      title="Rejeter"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
