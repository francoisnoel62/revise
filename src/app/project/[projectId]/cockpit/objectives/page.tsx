// ABOUTME: Objectives page for managing the project milestone and writing quotas
// ABOUTME: Milestone = total target + deadline; quotas = recurring daily/weekly rates

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
import {
  listWritingQuotasAction,
  createWritingQuotaAction,
  updateWritingQuotaAction,
  deleteWritingQuotaAction,
  SerializedWritingQuota,
} from '@/app/actions/writing-quota-actions';
import { getProjectStatsAction, getWorkflowMetricsAction } from '@/app/actions/cockpit-actions';
import type { WorkflowMetrics } from '@/application/use-cases/GetWorkflowMetricsUseCase';
import {
  GoalForm,
  GoalCard,
  QuotaForm,
  QuotaCard,
  MilestoneMetricsCard,
  ActivityChart,
} from '@/components/cockpit';
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
import { QuotaPeriod } from '@/domain/entities/WritingQuota';

type PendingDelete =
  | { kind: 'goal'; id: string }
  | { kind: 'quota'; id: string }
  | null;

export default function ObjectivesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [goals, setGoals] = useState<SerializedWritingGoal[]>([]);
  const [quotas, setQuotas] = useState<SerializedWritingQuota[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isCreatingQuota, setIsCreatingQuota] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SerializedWritingGoal | null>(null);
  const [editingQuota, setEditingQuota] = useState<SerializedWritingQuota | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const timeZone =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const refreshMetrics = useCallback(async () => {
    const metricsResult = await getWorkflowMetricsAction(projectId, timeZone);
    if (metricsResult.success) setMetrics(metricsResult.metrics);
  }, [projectId, timeZone]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [goalsResult, quotasResult, statsResult, metricsResult] = await Promise.all([
        listWritingGoalsAction(projectId),
        listWritingQuotasAction(projectId),
        getProjectStatsAction(projectId),
        getWorkflowMetricsAction(projectId, timeZone),
      ]);

      if (goalsResult.success) setGoals(goalsResult.goals);
      if (quotasResult.success) setQuotas(quotasResult.quotas);
      if (statsResult.success) setWordCount(statsResult.stats.wordCount);
      if (metricsResult.success) setMetrics(metricsResult.metrics);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, timeZone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGoal = async (data: { targetWords: number; deadline?: string }) => {
    setIsCreatingGoal(true);
    try {
      const result = await createWritingGoalAction(projectId, data.targetWords, data.deadline);
      if (result.success) {
        setGoals((prev) => [result.goal, ...prev]);
        void refreshMetrics();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleEditGoal = async (data: { targetWords: number; deadline?: string }) => {
    if (!editingGoal) return;

    const result = await updateWritingGoalAction(editingGoal.id, {
      targetWords: data.targetWords,
      deadline: data.deadline ?? null,
    });

    if (result.success) {
      setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? result.goal : g)));
      setEditingGoal(null);
      void refreshMetrics();
    } else {
      throw new Error(result.error);
    }
  };

  const handleCreateQuota = async (data: { period: QuotaPeriod; targetWords: number }) => {
    setIsCreatingQuota(true);
    try {
      const result = await createWritingQuotaAction(projectId, data.period, data.targetWords);
      if (result.success) {
        setQuotas((prev) => [result.quota, ...prev]);
        void refreshMetrics();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreatingQuota(false);
    }
  };

  const handleEditQuota = async (data: { period: QuotaPeriod; targetWords: number }) => {
    if (!editingQuota) return;

    const result = await updateWritingQuotaAction(editingQuota.id, {
      period: data.period,
      targetWords: data.targetWords,
    });

    if (result.success) {
      setQuotas((prev) => prev.map((q) => (q.id === editingQuota.id ? result.quota : q)));
      setEditingQuota(null);
      void refreshMetrics();
    } else {
      throw new Error(result.error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.kind === 'goal') {
      const result = await deleteWritingGoalAction(pendingDelete.id);
      if (result.success) {
        setGoals((prev) => prev.filter((g) => g.id !== pendingDelete.id));
      }
    } else {
      const result = await deleteWritingQuotaAction(pendingDelete.id);
      if (result.success) {
        setQuotas((prev) => prev.filter((q) => q.id !== pendingDelete.id));
      }
    }

    setPendingDelete(null);
    void refreshMetrics();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-muted-foreground">Définissez vos objectifs d&apos;écriture</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
        <p className="text-muted-foreground">
          Définissez votre objectif global et votre rythme d&apos;écriture, puis suivez votre progression
        </p>
      </div>

      {/* Milestone section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Objectif global</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <GoalForm onSubmit={handleCreateGoal} isLoading={isCreatingGoal} />
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun objectif global défini. Fixez un total de mots à atteindre, avec une échéance.
              </p>
            ) : (
              goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  currentWordCount={wordCount}
                  onEdit={setEditingGoal}
                  onDelete={(id) => setPendingDelete({ kind: 'goal', id })}
                />
              ))
            )}
          </div>
        </div>
        <MilestoneMetricsCard
          milestone={metrics?.milestone ?? null}
          averagePerDay={metrics?.averagePerDay ?? 0}
          dailyStreak={metrics?.dailyStreak ?? 0}
          dailyStreakTarget={metrics?.dailyStreakTarget ?? 1}
        />
      </section>

      {/* Quotas section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Rythme (quotas)</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <QuotaForm onSubmit={handleCreateQuota} isLoading={isCreatingQuota} />
          <div className="space-y-4">
            {quotas.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun quota défini. Fixez un rythme quotidien ou hebdomadaire à tenir.
              </p>
            ) : (
              quotas.map((quota) => {
                const quotaMetrics = metrics?.quotas.find((q) => q.id === quota.id);
                return (
                  <QuotaCard
                    key={quota.id}
                    quota={quota}
                    metrics={
                      quotaMetrics
                        ? {
                            writtenInPeriod: quotaMetrics.writtenInPeriod,
                            progress: quotaMetrics.progress,
                            isMet: quotaMetrics.isMet,
                          }
                        : undefined
                    }
                    onEdit={setEditingQuota}
                    onDelete={(id) => setPendingDelete({ kind: 'quota', id })}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Activity section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Activité</h2>
        <ActivityChart activity={metrics?.activity ?? []} />
      </section>

      {/* Edit milestone dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;objectif global</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              onSubmit={handleEditGoal}
              initialValues={{
                targetWords: editingGoal.targetWords,
                deadline: editingGoal.deadline?.split('T')[0],
              }}
              submitLabel="Enregistrer"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit quota dialog */}
      <Dialog open={!!editingQuota} onOpenChange={() => setEditingQuota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le quota</DialogTitle>
          </DialogHeader>
          {editingQuota && (
            <QuotaForm
              onSubmit={handleEditQuota}
              initialValues={{
                period: editingQuota.period,
                targetWords: editingQuota.targetWords,
              }}
              submitLabel="Enregistrer"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;élément sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
