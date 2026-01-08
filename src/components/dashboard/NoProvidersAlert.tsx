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
    // Check if user has providers
    const checkProviders = async () => {
      try {
        const result = await listProvidersAction();
        if (result.success) {
          setHasProviders(result.data.length > 0);
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
        <AlertTitle>Configure your AI Provider</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            You haven&apos;t configured an AI provider yet. Add your API key to start using
            AI-powered text rewrites in your projects.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              Add AI Provider
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <ProvidersDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
