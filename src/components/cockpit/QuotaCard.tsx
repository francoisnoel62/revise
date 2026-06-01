// ABOUTME: Card displaying a recurring writing quota (daily/weekly rate)
// ABOUTME: Shows the target rate and edit/delete actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Gauge } from 'lucide-react';
import { SerializedWritingQuota } from '@/app/actions/writing-quota-actions';
import { QuotaPeriod } from '@/domain/entities/WritingQuota';

interface QuotaCardProps {
  quota: SerializedWritingQuota;
  onEdit: (quota: SerializedWritingQuota) => void;
  onDelete: (quotaId: string) => void;
}

const periodLabels: Record<QuotaPeriod, string> = {
  daily: 'par jour',
  weekly: 'par semaine',
};

export function QuotaCard({ quota, onEdit, onDelete }: QuotaCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          {quota.period === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(quota)}
            aria-label="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(quota.id)}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">
          {quota.targetWords.toLocaleString('fr-FR')} mots{' '}
          <span className="text-sm font-normal text-muted-foreground">
            {periodLabels[quota.period]}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Le suivi de progression de la période arrive avec les métriques.
        </p>
      </CardContent>
    </Card>
  );
}
