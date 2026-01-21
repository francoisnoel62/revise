// ABOUTME: Cockpit Overview page displaying project statistics
// ABOUTME: Shows word count, chapter count, reading time, and progress

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProjectStatsAction } from '@/app/actions/cockpit-actions';
import { StatCard, ProgressCard } from '@/components/cockpit';
import { FileText, Type, Clock, BookOpen } from 'lucide-react';

interface OverviewPageProps {
  params: Promise<{ projectId: string }>;
}

async function StatsGrid({ projectId }: { projectId: string }) {
  const result = await getProjectStatsAction(projectId);

  if (!result.success) {
    notFound();
  }

  const { stats } = result;

  // Placeholder target for now - will be dynamic in Phase 2
  const targetWordCount = 50000;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Temps de lecture"
          value={stats.readingTime}
          description="Estimé à 200 mots/min"
          icon={Clock}
        />
      </div>

      {/* Progress Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProgressCard
          title="Progression vers l'objectif"
          current={stats.wordCount}
          target={targetWordCount}
          unit="mots"
        />
      </div>

      {/* Quick Actions - Placeholder for future */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
        <p className="text-sm text-muted-foreground">
          Les actions rapides seront ajoutées dans les prochaines phases.
        </p>
      </div>
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
