// ABOUTME: Card displaying a writing goal with progress and actions
// ABOUTME: Shows target, progress based on period (daily/weekly/total), deadline, and edit/delete buttons

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Target, Calendar, AlertCircle } from 'lucide-react';
import { SerializedWritingGoal } from '@/app/actions/writing-goal-actions';
import { GoalType } from '@/domain/entities/WritingGoal';

interface GoalCardProps {
  goal: SerializedWritingGoal;
  periodWordCount: number;
  periodLabel: string;
  onEdit: (goal: SerializedWritingGoal) => void;
  onDelete: (goalId: string) => void;
}

const goalTypeLabels: Record<GoalType, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  total: 'Projet total',
};

export function GoalCard({
  goal,
  periodWordCount,
  periodLabel,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const progress = Math.min(100, (periodWordCount / goal.targetWords) * 100);
  const isCompleted = periodWordCount >= goal.targetWords;
  const remaining = Math.max(0, goal.targetWords - periodWordCount);

  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const isOverdue = deadline && new Date() > deadline && !isCompleted;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Card className={isOverdue ? 'border-destructive' : ''}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            {goalTypeLabels[goal.type]}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge variant="default" className="bg-green-500">
                Complété
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                En retard
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(goal)}
            aria-label="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(goal.id)}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{periodWordCount.toLocaleString('fr-FR')} mots</span>
            <span>{goal.targetWords.toLocaleString('fr-FR')} mots</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {isCompleted
              ? 'Objectif atteint !'
              : `${remaining.toLocaleString('fr-FR')} mots restants (${progress.toFixed(0)}%)`}
          </p>
          {goal.type !== 'total' && (
            <p className="text-xs text-muted-foreground italic">
              {periodLabel} : {periodWordCount.toLocaleString('fr-FR')} mots écrits
            </p>
          )}
        </div>

        {deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Échéance : {formatDate(goal.deadline!)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
