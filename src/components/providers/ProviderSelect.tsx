'use client';

import * as React from 'react';
import { SafeProvider } from '@/app/actions/provider-actions';
import { listProvidersAction } from '@/app/actions/provider-actions';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PROVIDER_NAMES } from '@/application/providers/ProviderCatalog';

export interface ProviderSelectProps {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showValidationStatus?: boolean;
}

/**
 * ProviderSelect component - searchable dropdown for selecting an AI provider.
 * Shows provider name, type, validation status, and model.
 * Used in project settings and creation flows.
 */
export function ProviderSelect({
  value,
  onValueChange,
  placeholder = 'Sélectionner un provider...',
  disabled = false,
  showValidationStatus = true,
}: ProviderSelectProps) {
  const [providers, setProviders] = React.useState<SafeProvider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load providers on mount
  React.useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      try {
        const result = await listProvidersAction();
        if (result.success) {
          setProviders(result.data);
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  // Build combobox options
  const options: ComboboxOption[] = React.useMemo(() => {
    if (providers.length === 0) {
      return [];
    }

    return providers.map((provider) => {
      const providerName = PROVIDER_NAMES[provider.type];
      const statusBadge = provider.isValid ? '✓' : '✗';

      return {
        value: provider.id,
        label: showValidationStatus
          ? `${statusBadge} ${provider.name} (${providerName})`
          : `${provider.name} (${providerName})`,
      };
    });
  }, [providers, showValidationStatus]);

  // Find selected provider
  const selectedProvider = providers.find((p) => p.id === value);

  if (isLoading) {
    return (
      <Combobox
        options={[]}
        value=""
        placeholder="Chargement des providers..."
        disabled={true}
      />
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>Aucun provider configuré. Ajoutez-en un dans le menu utilisateur.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Combobox
        options={options}
        value={value || ''}
        onValueChange={(newValue) => onValueChange?.(newValue || null)}
        placeholder={placeholder}
        disabled={disabled}
        searchPlaceholder="Rechercher des providers..."
        emptyText="Aucun provider trouvé."
      />
      {selectedProvider && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {selectedProvider.isValid ? (
            <>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Valide
              </Badge>
              <span>Modèle : {selectedProvider.model}</span>
            </>
          ) : (
            <>
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Invalide
              </Badge>
              <span>
                Ce provider n&apos;est pas valide. Testez la connexion dans les
                paramètres du provider.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
