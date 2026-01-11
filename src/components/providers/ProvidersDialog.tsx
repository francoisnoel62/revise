'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2 } from 'lucide-react';
import {
  SafeProvider,
  SafeAccountBalance,
  listProvidersAction,
  deleteProviderAction,
  getAccountBalanceAction,
} from '@/app/actions/provider-actions';
import { ProviderCard } from './ProviderCard';
import { ProviderForm } from './ProviderForm';

export interface ProvidersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogMode = 'list' | 'create' | 'edit';

/**
 * ProvidersDialog component - main dialog for managing AI providers.
 * Handles listing, creating, editing, and deleting providers.
 */
export function ProvidersDialog({ open, onOpenChange }: ProvidersDialogProps) {
  // State
  const [mode, setMode] = React.useState<DialogMode>('list');
  const [providers, setProviders] = React.useState<SafeProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = React.useState<SafeProvider | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Balance state - map of providerId to balance
  const [balances, setBalances] = React.useState<Record<string, SafeAccountBalance>>({});
  const [loadingBalances, setLoadingBalances] = React.useState<Set<string>>(new Set());

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [providerToDelete, setProviderToDelete] = React.useState<SafeProvider | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load providers when dialog opens
  React.useEffect(() => {
    if (open) {
      loadProviders();
    }
  }, [open]);

  const loadProviders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listProvidersAction();
      if (result.success) {
        setProviders(result.data);
        // Fetch balances for all providers in parallel
        fetchBalances(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances for all providers in parallel
  const fetchBalances = async (providerList: SafeProvider[]) => {
    // Mark all as loading
    setLoadingBalances(new Set(providerList.map((p) => p.id)));

    // Fetch balances in parallel
    const balancePromises = providerList.map(async (provider) => {
      try {
        const result = await getAccountBalanceAction(provider.id);
        if (result.success) {
          return { providerId: provider.id, balance: result.data };
        }
        return {
          providerId: provider.id,
          balance: {
            used: 0,
            limit: null,
            renewalDate: null,
            currency: 'USD',
            available: false,
            errorMessage: result.error,
          } as SafeAccountBalance,
        };
      } catch {
        return {
          providerId: provider.id,
          balance: {
            used: 0,
            limit: null,
            renewalDate: null,
            currency: 'USD',
            available: false,
            errorMessage: 'Failed to fetch balance',
          } as SafeAccountBalance,
        };
      }
    });

    const results = await Promise.all(balancePromises);

    // Update balances state
    const newBalances: Record<string, SafeAccountBalance> = {};
    for (const { providerId, balance } of results) {
      newBalances[providerId] = balance;
    }
    setBalances(newBalances);
    setLoadingBalances(new Set());
  };

  // Handle create provider
  const handleCreate = () => {
    setSelectedProvider(null);
    setMode('create');
  };

  // Handle edit provider
  const handleEdit = (provider: SafeProvider) => {
    setSelectedProvider(provider);
    setMode('edit');
  };

  // Handle delete provider
  const handleDelete = (provider: SafeProvider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!providerToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteProviderAction(providerToDelete.id);
      if (result.success) {
        await loadProviders();
        setDeleteDialogOpen(false);
        setProviderToDelete(null);
      } else {
        // Show error in delete dialog
        setError(result.error);
      }
    } catch {
      setError('Failed to delete provider');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form success (create or update)
  const handleFormSuccess = async () => {
    await loadProviders();
    setMode('list');
    setSelectedProvider(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setMode('list');
    setSelectedProvider(null);
  };

  // Handle provider validated
  const handleProviderValidated = (updatedProvider: SafeProvider) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === updatedProvider.id ? updatedProvider : p))
    );
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMode('list');
      setSelectedProvider(null);
      setError(null);
      setBalances({});
      setLoadingBalances(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {mode === 'list' && 'My AI Providers'}
              {mode === 'create' && 'Add AI Provider'}
              {mode === 'edit' && 'Edit AI Provider'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'list' &&
                'Manage your AI provider API keys and configurations.'}
              {mode === 'create' &&
                'Configure a new AI provider for your writing projects.'}
              {mode === 'edit' && 'Update your AI provider configuration.'}
            </DialogDescription>
          </DialogHeader>

          {/* List Mode */}
          {mode === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {providers.length === 0
                    ? 'No providers configured yet'
                    : `${providers.length} provider${providers.length !== 1 ? 's' : ''} configured`}
                </p>
                <Button onClick={handleCreate} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Add your first AI provider to start using AI-powered rewrites.
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Provider
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-100 pr-4">
                  <div className="grid gap-4">
                    {providers.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        balance={balances[provider.id]}
                        isLoadingBalance={loadingBalances.has(provider.id)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onValidated={handleProviderValidated}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Create/Edit Mode */}
          {(mode === 'create' || mode === 'edit') && (
            <ScrollArea className="h-125 pr-4">
              <ProviderForm
                provider={selectedProvider || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{providerToDelete?.name}</strong>? This action cannot be
              undone.
              {providerToDelete && !providerToDelete.isValid && (
                <p className="mt-2 text-yellow-600">
                  Note: This provider is marked as invalid. Deleting it may affect
                  projects using it.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
