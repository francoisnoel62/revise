// ABOUTME: Form component for creating/editing writing goals
// ABOUTME: Provides inputs for target words, type, and deadline

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
import { GoalType } from '@/domain/entities/WritingGoal';

interface GoalFormProps {
  onSubmit: (data: {
    type: GoalType;
    targetWords: number;
    deadline?: string;
  }) => Promise<void>;
  initialValues?: {
    type: GoalType;
    targetWords: number;
    deadline?: string;
  };
  isLoading?: boolean;
  submitLabel?: string;
}

const goalTypeLabels: Record<GoalType, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  total: 'Projet total',
};

export function GoalForm({
  onSubmit,
  initialValues,
  isLoading = false,
  submitLabel = "Créer l'objectif",
}: GoalFormProps) {
  const [type, setType] = useState<GoalType>(initialValues?.type ?? 'total');
  const [targetWords, setTargetWords] = useState(
    initialValues?.targetWords?.toString() ?? ''
  );
  const [deadline, setDeadline] = useState(initialValues?.deadline ?? '');
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
      await onSubmit({
        type,
        targetWords: words,
        deadline: deadline || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvel objectif</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type d&apos;objectif</Label>
            <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(goalTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetWords">Objectif de mots</Label>
            <Input
              id="targetWords"
              type="number"
              min="1"
              value={targetWords}
              onChange={(e) => setTargetWords(e.target.value)}
              placeholder="ex: 50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date limite (optionnel)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Création...' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
