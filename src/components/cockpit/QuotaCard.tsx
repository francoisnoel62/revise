// ABOUTME: Card displaying a recurring writing quota (daily/weekly rate)
// ABOUTME: Shows the target rate, real progress for the current period, and edit/delete actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Gauge } from 'lucide-react';
import { SerializedWritingQuota } from '@/app/actions/writing-quota-actions';
import { QuotaPeriod } from '@/domain/entities/WritingQuota';

interface QuotaCardProps {
  quota: SerializedWritingQuota;
  onEdit: (quota: SerializedWritingQuota) => void;
  onDelete: (quotaId: string) => void;
  /** Real progress for the current period; absent until metrics have loaded. */
  metrics?: {
    writtenInPeriod: number;
    progress: number;
    isMet: boolean;
  };
}

const periodLabels: Record<QuotaPeriod, string> = {
  daily: 'par jour',
  weekly: 'par semaine',
};

const periodWindow: Record<QuotaPeriod, string> = {
  daily: "aujourd'hui",
  weekly: 'cette semaine',
};

export function QuotaCard({ quota, onEdit, onDelete, metrics }: QuotaCardProps) {
  const written = Math.max(0, metrics?.writtenInPeriod ?? 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            {quota.period === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
          </CardTitle>
          {metrics?.isMet && (
            <Badge variant="default" className="bg-green-500">
              Atteint {periodWindow[quota.period]}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(quota)} aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(quota.id)} aria-label="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {quota.targetWords.toLocaleString('fr-FR')} mots {periodLabels[quota.period]}
        </p>

        {metrics ? (
          <>
            <div className="flex justify-between text-sm">
              <span>{written.toLocaleString('fr-FR')} mots {periodWindow[quota.period]}</span>
              <span>{quota.targetWords.toLocaleString('fr-FR')} mots</span>
            </div>
            <Progress value={metrics.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {metrics.isMet
                ? 'Quota atteint, bravo !'
                : `${metrics.progress}% du quota ${periodWindow[quota.period]}`}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Chargement de la progression…</p>
        )}
      </CardContent>
    </Card>
  );
}
