// ABOUTME: Form component for creating/editing the project word count milestone
// ABOUTME: Provides inputs for target words and an optional deadline

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoalFormProps {
  onSubmit: (data: { targetWords: number; deadline?: string }) => Promise<void>;
  initialValues?: {
    targetWords: number;
    deadline?: string;
  };
  isLoading?: boolean;
  submitLabel?: string;
}

export function GoalForm({
  onSubmit,
  initialValues,
  isLoading = false,
  submitLabel = "Définir l'objectif global",
}: GoalFormProps) {
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
        <CardTitle>Objectif global</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetWords">Objectif de mots</Label>
            <Input
              id="targetWords"
              type="number"
              min="1"
              value={targetWords}
              onChange={(e) => setTargetWords(e.target.value)}
              placeholder="ex: 80000"
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
            {isLoading ? 'Enregistrement...' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
