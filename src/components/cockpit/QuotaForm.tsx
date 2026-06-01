// ABOUTME: Form component for creating/editing a recurring writing quota
// ABOUTME: Provides inputs for the period (daily/weekly) and the word target

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuotaPeriod } from '@/domain/entities/WritingQuota';

interface QuotaFormProps {
  onSubmit: (data: { period: QuotaPeriod; targetWords: number }) => Promise<void>;
  initialValues?: {
    period: QuotaPeriod;
    targetWords: number;
  };
  isLoading?: boolean;
  submitLabel?: string;
}

const periodLabels: Record<QuotaPeriod, string> = {
  daily: 'Par jour',
  weekly: 'Par semaine',
};

export function QuotaForm({
  onSubmit,
  initialValues,
  isLoading = false,
  submitLabel = 'Ajouter le quota',
}: QuotaFormProps) {
  const [period, setPeriod] = useState<QuotaPeriod>(initialValues?.period ?? 'daily');
  const [targetWords, setTargetWords] = useState(
    initialValues?.targetWords?.toString() ?? ''
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const words = parseInt(targetWords, 10);
    if (isNaN(words) || words <= 0) {
      setError('Veuillez entrer un nombre de mots valide');
      return;
    }

    try {
      await onSubmit({ period, targetWords: words });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rythme d&apos;écriture</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period">Période</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as QuotaPeriod)}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotaTarget">Objectif de mots</Label>
            <Input
              id="quotaTarget"
              type="number"
              min="1"
              value={targetWords}
              onChange={(e) => setTargetWords(e.target.value)}
              placeholder="ex: 1000"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enregistrement...' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
