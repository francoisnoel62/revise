// ABOUTME: Objectives page for managing writing goals
// ABOUTME: Allows creating, viewing, editing, and deleting goals

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  listWritingGoalsAction,
  createWritingGoalAction,
  updateWritingGoalAction,
  deleteWritingGoalAction,
  SerializedWritingGoal,
} from '@/app/actions/writing-goal-actions';
import { getProjectStatsAction } from '@/app/actions/cockpit-actions';
import { GoalForm, GoalCard } from '@/components/cockpit';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GoalType } from '@/domain/entities/WritingGoal';

export default function ObjectivesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [goals, setGoals] = useState<SerializedWritingGoal[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SerializedWritingGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [goalsResult, statsResult] = await Promise.all([
        listWritingGoalsAction(projectId),
        getProjectStatsAction(projectId),
      ]);

      if (goalsResult.success) {
        setGoals(goalsResult.goals);
      }

      if (statsResult.success) {
        setWordCount(statsResult.stats.wordCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: {
    type: GoalType;
    targetWords: number;
    deadline?: string;
  }) => {
    setIsCreating(true);
    try {
      const result = await createWritingGoalAction(
        projectId,
        data.type,
        data.targetWords,
        data.deadline
      );

      if (result.success) {
        setGoals((prev) => [result.goal, ...prev]);
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (data: {
    type: GoalType;
    targetWords: number;
    deadline?: string;
  }) => {
    if (!editingGoal) return;

    const result = await updateWritingGoalAction(editingGoal.id, {
      type: data.type,
      targetWords: data.targetWords,
      deadline: data.deadline ?? null,
    });

    if (result.success) {
      setGoals((prev) =>
        prev.map((g) => (g.id === editingGoal.id ? result.goal : g))
      );
      setEditingGoal(null);
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingGoalId) return;

    const result = await deleteWritingGoalAction(deletingGoalId);

    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== deletingGoalId));
    }

    setDeletingGoalId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-muted-foreground">
            Définissez vos objectifs d&apos;écriture
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
        <p className="text-muted-foreground">
          Définissez vos objectifs d&apos;écriture et suivez votre progression
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Goal Form */}
        <GoalForm onSubmit={handleCreate} isLoading={isCreating} />

        {/* Goals List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Vos objectifs</h2>
          {goals.length === 0 ? (
            <p className="text-muted-foreground">
              Aucun objectif défini. Créez votre premier objectif !
            </p>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currentWordCount={wordCount}
                onEdit={setEditingGoal}
                onDelete={setDeletingGoalId}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;objectif</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              onSubmit={handleEdit}
              initialValues={{
                type: editingGoal.type,
                targetWords: editingGoal.targetWords,
                deadline: editingGoal.deadline?.split('T')[0],
              }}
              submitLabel="Enregistrer"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingGoalId}
        onOpenChange={() => setDeletingGoalId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;objectif ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;objectif sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
