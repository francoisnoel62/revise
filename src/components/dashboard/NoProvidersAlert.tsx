'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Key } from 'lucide-react';
import { ProvidersDialog } from '@/components/providers/ProvidersDialog';
import { listProvidersAction } from '@/app/actions/provider-actions';

/**
 * NoProvidersAlert component - alerts users when they have no AI providers configured.
 * Displays on dashboard and provides quick access to provider configuration.
 * Auto-hides when user has at least one provider.
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
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configurez votre fournisseur IA</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            Vous devez configurer au moins un fournisseur IA (OpenAI, Anthropic, etc.) pour créer des projets et utiliser la réécriture de texte. Ajoutez votre clé API pour commencer.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              Ajouter un fournisseur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
            >
              Ignorer
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <ProvidersDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
