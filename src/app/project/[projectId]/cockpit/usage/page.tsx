// ABOUTME: Dedicated page for detailed AI usage statistics
// ABOUTME: Shows comprehensive charts and historical data

'use client';

import { useParams } from 'next/navigation';
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilisation IA</h1>
        <p className="text-muted-foreground">
          Statistiques d&apos;utilisation de l&apos;intelligence artificielle
        </p>
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
