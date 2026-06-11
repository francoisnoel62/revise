// ABOUTME: Dedicated page for detailed AI usage statistics
// ABOUTME: Shows comprehensive charts and historical data

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import {
  UsageStatsCard,
  UsageByOperationChart,
  DailyUsageChart,
} from '@/components/cockpit';

export default function UsagePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisation IA</h1>
          <p className="text-muted-foreground">
            Statistiques d&apos;utilisation de l&apos;intelligence artificielle
          </p>
        </div>
        <Link
          href="/historique-ia"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Eye className="h-4 w-4" />
          Voir le journal des échanges
        </Link>
      </div>

      {/* Summary Stats */}
      <UsageStatsCard projectId={projectId} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <UsageByOperationChart projectId={projectId} />
        <DailyUsageChart projectId={projectId} days={30} />
      </div>
    </div>
  );
}
