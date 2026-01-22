// ABOUTME: Cockpit Overview page displaying project statistics
// ABOUTME: Shows word count, chapter count, reading time, and progress

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getProjectStatsAction,
  getLastEditedChapterAction,
  getOverdueTaskCountAction,
} from '@/app/actions/cockpit-actions';
import { getTaskSummaryAction } from '@/app/actions/task-actions';
import { StatCard, ProgressCard, UsageStatsCard, TaskSummaryCard, QuickActionsCard } from '@/components/cockpit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Type, Clock, BookOpen, Users } from 'lucide-react';

interface OverviewPageProps {
  params: Promise<{ projectId: string }>;
}

async function StatsGrid({ projectId }: { projectId: string }) {
  const [result, summaryResult, lastEditedResult, overdueResult] = await Promise.all([
    getProjectStatsAction(projectId),
    getTaskSummaryAction(projectId),
    getLastEditedChapterAction(projectId),
    getOverdueTaskCountAction(projectId),
  ]);

  if (!result.success) {
    notFound();
  }

  const { stats } = result;
  const taskSummary = summaryResult.success ? summaryResult.summary : null;
  const lastEditedChapter = lastEditedResult.success ? lastEditedResult.chapter : null;
  const overdueTaskCount = overdueResult.success ? overdueResult.count : 0;

  const targetWordCount = stats.activeGoal?.targetWords ?? 0;
  const hasGoal = stats.activeGoal !== null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Nombre de mots"
          value={stats.wordCount.toLocaleString('fr-FR')}
          description="Total du projet"
          icon={Type}
        />
        <StatCard
          title="Caractères"
          value={stats.characterCount.toLocaleString('fr-FR')}
          description="Espaces inclus"
          icon={FileText}
        />
        <StatCard
          title="Chapitres"
          value={stats.chapterCount}
          description="Nombre de chapitres"
          icon={BookOpen}
        />
        <StatCard
          title="Personnages"
          value={stats.fictionalCharacterCount}
          description="Fiches créées"
          icon={Users}
          href={`/project/${projectId}/cockpit/characters`}
        />
        <StatCard
          title="Temps de lecture"
          value={stats.readingTime}
          description="Estimé à 200 mots/min"
          icon={Clock}
        />
      </div>

      {/* Progress Card or "Create Goal" prompt and Usage Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {hasGoal ? (
          <ProgressCard
            title="Progression vers l'objectif"
            current={stats.wordCount}
            target={targetWordCount}
            unit="mots"
          />
        ) : (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Objectif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aucun objectif défini.{' '}
                <Link
                  href={`/project/${projectId}/cockpit/objectives`}
                  className="text-primary hover:underline"
                >
                  Créer un objectif
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
        <UsageStatsCard projectId={projectId} />
      </div>

      {/* Task Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tâches</h2>
          <Link
            href={`/project/${projectId}/cockpit/tasks`}
            className="text-sm text-primary hover:underline"
          >
            Voir toutes les tâches
          </Link>
        </div>
        <TaskSummaryCard summary={taskSummary} />
      </div>

      {/* Quick Actions */}
      <QuickActionsCard
        projectId={projectId}
        lastEditedChapterId={lastEditedChapter?.chapterId ?? null}
        lastEditedChapterTitle={lastEditedChapter?.chapterTitle ?? null}
        overdueTaskCount={overdueTaskCount}
        hasChapters={stats.chapterCount > 0}
      />
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <StatCard key={i} title="" value="" isLoading />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ProgressCard title="" current={0} target={0} isLoading />
      </div>
    </div>
  );
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
        <p className="text-muted-foreground">
          Statistiques et progression de votre projet
        </p>
      </div>

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid projectId={projectId} />
      </Suspense>
    </div>
  );
}
