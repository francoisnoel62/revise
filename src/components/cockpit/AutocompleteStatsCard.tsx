// ABOUTME: Card displaying autocomplete lifecycle metrics for a project
// ABOUTME: Shows acceptance, partial acceptance, rejection, deletion and latency percentiles

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, Timer } from 'lucide-react';
import { getProjectAutocompleteStatsAction } from '@/app/actions/usage-actions';
import type { AutocompleteStats } from '@/domain/interfaces/AutocompleteEventRepository';

interface AutocompleteStatsCardProps {
  projectId: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

function formatPercent(rate: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(rate);
}

function formatMs(ms: number | null): string {
  return ms === null ? '—' : `${Math.round(ms)} ms`;
}

function formatProvider(providerType: string | null): string {
  if (!providerType) return 'Provider inconnu';
  return PROVIDER_LABELS[providerType] ?? providerType;
}

function formatModel(model: string | null): string {
  return model ?? 'Modele inconnu';
}

function AutocompleteStatsCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

export function AutocompleteStatsCard({ projectId }: AutocompleteStatsCardProps) {
  const [stats, setStats] = useState<AutocompleteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const result = await getProjectAutocompleteStatsAction(projectId);

      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }

    fetchStats();
  }, [projectId]);

  if (isLoading) {
    return <AutocompleteStatsCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Autocomplétion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Autocomplétion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune suggestion mesurée pour ce projet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rejected = stats.byOutcome.rejected_escape + stats.byOutcome.superseded_typing;
  const providerModels = stats.byProviderModel.slice(0, 3);

  return (
    <Card className="h-full" data-testid="autocomplete-stats-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Autocomplétion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Suggestions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatPercent(stats.acceptanceRate)}</div>
            <div className="text-xs text-muted-foreground">Acceptées</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatPercent(stats.partialAcceptanceRate)}</div>
            <div className="text-xs text-muted-foreground">Partielles</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatPercent(stats.postInsertionDeletionRate)}
            </div>
            <div className="text-xs text-muted-foreground">Supprimées</div>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-2 font-medium">
              <Timer className="h-4 w-4 text-blue-500" />
              Latence premier token
            </div>
            <div className="mt-2 flex justify-between text-muted-foreground">
              <span>p50</span>
              <span className="font-medium text-foreground">{formatMs(stats.firstTokenMsP50)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>p95</span>
              <span className="font-medium text-foreground">{formatMs(stats.firstTokenMsP95)}</span>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-medium">Issues</div>
            <div className="mt-2 flex justify-between text-muted-foreground">
              <span>Rejets / remplacées</span>
              <span className="font-medium text-foreground">{rejected}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Réponses vides</span>
              <span className="font-medium text-foreground">{stats.byOutcome.empty}</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">Provider / modele</div>
          <div className="mt-2 space-y-2">
            {providerModels.map((entry) => (
              <div
                key={`${entry.providerType ?? 'unknown'}-${entry.model ?? 'unknown'}`}
                className="flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-medium">
                    {formatProvider(entry.providerType)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatModel(entry.model)}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">{entry.total}</span>{' '}
                    suggestions
                  </div>
                  <div>{formatPercent(entry.acceptanceRate)} acceptees</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
