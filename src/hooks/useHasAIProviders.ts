// ABOUTME: Hook for checking if user has valid AI providers configured.
// ABOUTME: Returns loading state and boolean indicating AI feature availability.

import { useState, useEffect, useCallback } from 'react';
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';

interface UseHasAIProvidersResult {
  hasAIProviders: boolean;
  providers: SafeProvider[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook that checks if the user has at least one valid AI provider configured.
 * Used to conditionally show/hide AI features in the editor.
 */
export function useHasAIProviders(): UseHasAIProvidersResult {
  const [providers, setProviders] = useState<SafeProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listProvidersAction();
      if (result.success && result.data) {
        setProviders(result.data);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const validProviders = providers.filter((p) => p.isValid);
  const hasAIProviders = validProviders.length > 0;

  return {
    hasAIProviders,
    providers,
    isLoading,
    refresh: loadProviders,
  };
}
