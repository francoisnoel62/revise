// ABOUTME: Card displaying AI usage statistics for a project
// ABOUTME: Shows total operations, tokens consumed, and breakdown by operation type

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Zap, Timer, Euro } from 'lucide-react';
import { AI_OPERATION_LABELS } from '@/lib/ui-labels';
import { getProjectUsageStatsAction } from '@/app/actions/usage-actions';

interface UsageStats {
  totalOperations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedInputTokens: number;
  totalDurationMs: number;
  totalCostEur: number;
  byOperation: Record<string, { count: number; inputTokens: number; outputTokens: number }>;
}

interface UsageStatsCardProps {
  projectId: string;
}

function formatNumber(n: number): string {
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toLocaleString('fr-FR');
}

function formatCostEur(eur: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(eur);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function UsageStatsCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UsageStatsCard({ projectId }: UsageStatsCardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const result = await getProjectUsageStatsAction(projectId);

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
    return <UsageStatsCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Utilisation IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalOperations === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Utilisation IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune utilisation IA enregistrée pour ce projet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get top 5 operations by count
  const sortedOperations = Object.entries(stats.byOperation)
    .filter(([, data]) => data.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Utilisation IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalOperations)}</div>
            <div className="text-xs text-muted-foreground">Opérations</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              {formatNumber(totalTokens)}
            </div>
            <div className="text-xs text-muted-foreground">Tokens</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Euro className="h-4 w-4 text-emerald-600" />
              {formatCostEur(stats.totalCostEur)}
            </div>
            <div className="text-xs text-muted-foreground">Coût</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Timer className="h-4 w-4 text-blue-500" />
              {formatDuration(stats.totalDurationMs)}
            </div>
            <div className="text-xs text-muted-foreground">Temps total</div>
          </div>
        </div>

        {/* Token breakdown */}
        <div className="text-xs text-muted-foreground text-center">
          <span className="text-green-600">{formatNumber(stats.totalInputTokens)} entrée</span>
          {' / '}
          <span className="text-blue-600">{formatNumber(stats.totalOutputTokens)} sortie</span>
          {stats.totalCachedInputTokens > 0 && (
            <>
              {' · '}
              <span className="text-purple-600">
                {formatNumber(stats.totalCachedInputTokens)} cachés
              </span>
            </>
          )}
        </div>

        {/* Operations breakdown */}
        {sortedOperations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Par type</div>
            {sortedOperations.map(([operation, data]) => (
              <div key={operation} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {AI_OPERATION_LABELS[operation]}
                </span>
                <span className="font-medium">{data.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
