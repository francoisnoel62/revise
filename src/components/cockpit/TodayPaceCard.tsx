// ABOUTME: Compact cockpit overview widget showing the author's current writing rhythm
// ABOUTME: Client island that resolves the author timezone and loads workflow metrics

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Flame } from 'lucide-react';
import { getWorkflowMetricsAction } from '@/app/actions/cockpit-actions';
import type { WorkflowMetrics } from '@/application/use-cases/GetWorkflowMetricsUseCase';

interface TodayPaceCardProps {
  projectId: string;
}

export function TodayPaceCard({ projectId }: TodayPaceCardProps) {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeZone =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    getWorkflowMetricsAction(projectId, timeZone).then((result) => {
      if (cancelled) return;
      if (result.success) setMetrics(result.metrics);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Votre rythme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Moyenne récente</span>
              <span className="text-lg font-semibold">
                {(metrics?.averagePerDay ?? 0).toLocaleString('fr-FR')} mots/j
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3" /> Série
              </span>
              <span className="text-lg font-semibold">
                {metrics?.dailyStreak ?? 0} jour{(metrics?.dailyStreak ?? 0) > 1 ? 's' : ''}
              </span>
            </div>

            {metrics?.milestone?.requiredDailyPace != null && (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Rythme requis</span>
                <span className="text-lg font-semibold">
                  {metrics.milestone.requiredDailyPace.toLocaleString('fr-FR')} mots/j
                </span>
              </div>
            )}

            <Link
              href={`/project/${projectId}/cockpit/objectives`}
              className="text-sm text-primary hover:underline inline-block pt-1"
            >
              Voir les objectifs
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
