// ABOUTME: Bar chart showing AI usage breakdown by operation type
// ABOUTME: Displays operation counts with tokens on hover

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
import { AI_OPERATION_LABELS } from '@/lib/ui-labels';
import { getProjectUsageStatsAction } from '@/app/actions/usage-actions';

interface UsageStats {
  totalOperations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalDurationMs: number;
  byOperation: Record<string, { count: number; inputTokens: number; outputTokens: number }>;
}

interface UsageByOperationChartProps {
  projectId: string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function UsageByOperationChart({ projectId }: UsageByOperationChartProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const result = await getProjectUsageStatsAction(projectId);

      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }

    fetchStats();
  }, [projectId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Utilisation par type</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Utilisation par type</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalOperations === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Utilisation par type</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune donnee disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart - only include operations with count > 0
  const chartData = Object.entries(stats.byOperation)
    .filter(([, data]) => data.count > 0)
    .map(([operation, data]) => ({
      operation: AI_OPERATION_LABELS[operation] || operation,
      count: data.count,
      tokens: data.inputTokens + data.outputTokens,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Show top 8 operations

  const chartConfig = {
    count: {
      label: 'Operations',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Utilisation par type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="operation"
              width={100}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    const tokens = props.payload?.tokens;
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{value} operations</span>
                        {tokens > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {tokens.toLocaleString('fr-FR')} tokens
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={entry.operation} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
