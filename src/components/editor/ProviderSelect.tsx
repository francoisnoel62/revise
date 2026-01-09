// ABOUTME: Select component for AI provider selection using shadcn/ui.
// ABOUTME: Compact design for toolbar integration.

'use client';

import { SafeProvider } from '@/app/actions/provider-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProviderSelectProps {
  providers: SafeProvider[];
  selectedProviderId: string | null;
  onSelect: (providerId: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ProviderSelect({
  providers,
  selectedProviderId,
  onSelect,
  disabled = false,
  loading = false,
}: ProviderSelectProps) {
  // Filter to only show valid providers
  const validProviders = providers.filter((p) => p.isValid);
  const hasProviders = validProviders.length > 0;

  const handleValueChange = (value: string) => {
    onSelect(value === '__none__' ? null : value);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger size="sm" className="w-40 cursor-wait">
          <SelectValue placeholder="Chargement..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!hasProviders) {
    return (
      <Select disabled>
        <SelectTrigger
          size="sm"
          className="w-40"
          title="Configurez un fournisseur IA dans votre profil"
        >
          <SelectValue placeholder="Aucun fournisseur" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedProviderId || '__none__'}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder="Sélectionner..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Sélectionner...</SelectItem>
        {validProviders.map((provider) => (
          <SelectItem key={provider.id} value={provider.id}>
            {provider.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
