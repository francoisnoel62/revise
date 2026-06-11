// ABOUTME: Client button that triggers a pricing sync from OpenRouter via server action.
// ABOUTME: Shows progress and displays a summary of new/updated models after sync.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { triggerPricingSyncAction } from '@/app/actions/pricing-admin-actions';
import { useRouter } from 'next/navigation';

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    const result = await triggerPricingSyncAction();
    setSyncing(false);
    if (result.success) {
      const { newModels, updatedModels, totalModels } = result.data;
      setMessage(
        `✓ ${totalModels} modèles — ${newModels.length} nouveaux, ${updatedModels.length} mis à jour`
      );
      router.refresh();
    } else {
      setMessage(`Erreur : ${result.error}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Synchronisation…' : 'Synchroniser'}
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}
