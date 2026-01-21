// ABOUTME: Area chart showing AI usage over time
// ABOUTME: Displays daily operation counts and token usage

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyUsage } from '@/domain/interfaces/AIUsageRepository';
import { getProjectDailyUsageAction } from '@/app/actions/usage-actions';

interface DailyUsageChartProps {
  projectId: string;
  days?: number;
}

export function DailyUsageChart({ projectId, days = 30 }: DailyUsageChartProps) {
  const [usage, setUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      setIsLoading(true);
      const result = await getProjectDailyUsageAction(projectId, days);

      if (result.success) {
        setUsage(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }

    fetchUsage();
  }, [projectId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Evolution sur {days} jours</CardTitle>
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
          <CardTitle className="text-sm font-medium">Evolution sur {days} jours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!usage || usage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Evolution sur {days} jours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune donnee disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format dates for display
  const chartData = usage.map((d) => ({
    ...d,
    dateDisplay: new Date(d.date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    }),
    totalTokens: d.inputTokens + d.outputTokens,
  }));

  const chartConfig = {
    operations: {
      label: 'Operations',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Evolution sur {days} jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateDisplay"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    const tokens = props.payload?.totalTokens;
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
            <defs>
              <linearGradient id="fillOperations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="operations"
              stroke="hsl(var(--chart-1))"
              fill="url(#fillOperations)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
