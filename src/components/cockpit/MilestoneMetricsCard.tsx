// ABOUTME: Card summarising milestone workflow metrics: pace, projection, streak, average
// ABOUTME: Frames progress as encouragement, never pressure (Revise philosophy)

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, CalendarClock, Gauge } from 'lucide-react';
import type { MilestoneMetrics } from '@/application/use-cases/GetWorkflowMetricsUseCase';

interface MilestoneMetricsCardProps {
  milestone: MilestoneMetrics | null;
  averagePerDay: number;
  dailyStreak: number;
  dailyStreakTarget: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function MilestoneMetricsCard({
  milestone,
  averagePerDay,
  dailyStreak,
  dailyStreakTarget,
}: MilestoneMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Votre rythme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" /> Moyenne récente
            </p>
            <p className="text-lg font-semibold">
              {averagePerDay.toLocaleString('fr-FR')} mots/jour
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" /> Série en cours
            </p>
            <p className="text-lg font-semibold">
              {dailyStreak} jour{dailyStreak > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              ≥ {dailyStreakTarget.toLocaleString('fr-FR')} mots/jour
            </p>
          </div>
        </div>

        {milestone && milestone.deadline && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> Échéance
              </span>
              <span>
                {formatDate(milestone.deadline)}
                {milestone.daysRemaining !== null && (
                  <span className="text-muted-foreground">
                    {' '}
                    ({milestone.daysRemaining} j)
                  </span>
                )}
              </span>
            </div>

            {milestone.requiredDailyPace !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rythme requis</span>
                <span>{milestone.requiredDailyPace.toLocaleString('fr-FR')} mots/jour</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fin projetée</span>
              <span>
                {milestone.projectedCompletionDate
                  ? formatDate(milestone.projectedCompletionDate)
                  : 'À votre rythme'}
              </span>
            </div>

            {milestone.onTrack !== null && (
              <div className="pt-1">
                {milestone.onTrack ? (
                  <Badge variant="default" className="bg-green-500">
                    Dans les temps
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Un peu d&apos;avance à reprendre — un petit effort suffira
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {milestone && !milestone.deadline && (
          <p className="text-xs text-muted-foreground border-t pt-4">
            Ajoutez une échéance à votre objectif global pour estimer le rythme requis et la date de fin.
          </p>
        )}

        {!milestone && (
          <p className="text-xs text-muted-foreground border-t pt-4">
            Définissez un objectif global pour suivre votre rythme et une projection de fin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
