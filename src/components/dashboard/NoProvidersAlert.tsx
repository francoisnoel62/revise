'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Key } from 'lucide-react';
import { ProvidersDialog } from '@/components/providers/ProvidersDialog';
import { listProvidersAction } from '@/app/actions/provider-actions';

/**
 * NoProvidersAlert component - informational alert when no AI providers are configured.
 * Displays on dashboard to inform users that AI features are available if they configure a provider.
 * Auto-hides when user has at least one valid provider.
 */
export function NoProvidersAlert() {
  const [hasProviders, setHasProviders] = React.useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if user has valid providers
    const checkProviders = async () => {
      try {
        const result = await listProvidersAction();
        if (result.success) {
          // Check if user has at least one VALID provider
          const validProviders = result.data.filter((p) => p.isValid);
          setHasProviders(validProviders.length > 0);
        }
      } catch (error) {
        console.error('Failed to check providers:', error);
      }
    };

    checkProviders();
  }, [dialogOpen]); // Recheck when dialog closes

  // Don't show if user has providers, is dismissed, or still loading
  if (hasProviders === null || hasProviders || isDismissed) {
    return null;
  }

  return (
    <>
      <Alert variant="default" className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Fonctionnalités IA disponibles</AlertTitle>
        <AlertDescription className="text-blue-800">
          <p className="mb-3">
            Configurez un fournisseur IA (OpenAI, Anthropic, etc.) pour débloquer la réécriture de texte, la génération de chapitres et l&apos;analyse de métadonnées.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Key className="mr-2 h-4 w-4" />
              Configurer un fournisseur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              Plus tard
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <ProvidersDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
