// ABOUTME: Native select component for AI provider selection.
// ABOUTME: Compact design for toolbar integration.

'use client';

import { SafeProvider } from '@/app/actions/provider-actions';

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

  const handleChange = (e: React.ChangeEvent<globalThis.HTMLSelectElement>) => {
    const value = e.target.value;
    onSelect(value === '' ? null : value);
  };

  if (loading) {
    return (
      <select
        disabled
        className="h-9 px-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-400 cursor-wait"
      >
        <option>Chargement...</option>
      </select>
    );
  }

  if (!hasProviders) {
    return (
      <select
        disabled
        className="h-9 px-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-400"
        title="Configurez un fournisseur IA dans votre profil"
      >
        <option>Aucun fournisseur</option>
      </select>
    );
  }

  return (
    <select
      value={selectedProviderId || ''}
      onChange={handleChange}
      disabled={disabled}
      className="h-9 px-2 text-sm bg-white border border-slate-200 rounded-md hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">Sélectionner...</option>
      {validProviders.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.name}
        </option>
      ))}
    </select>
  );
}
