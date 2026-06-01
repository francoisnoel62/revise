// ABOUTME: Bar chart of words written per day over the recent activity window
// ABOUTME: Revision days (negative deltas) are shown distinctly, never as a failure

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import type { WritingActivityPoint } from '@/application/use-cases/GetWritingActivityUseCase';

interface ActivityChartProps {
  activity: WritingActivityPoint[];
}

export function ActivityChart({ activity }: ActivityChartProps) {
  const measured = activity.filter((p) => p.written !== null);

  const chartData = measured.map((p) => ({
    dateDisplay: new Date(p.localDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    }),
    written: p.written as number,
  }));

  const chartConfig = {
    written: { label: 'Mots écrits', color: 'hsl(var(--chart-1))' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Activité d&apos;écriture</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Pas encore d&apos;activité enregistrée. Écrivez quelques mots pour démarrer le suivi.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="dateDisplay"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="written" radius={4}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.written >= 0
                        ? 'hsl(var(--chart-1))'
                        : 'hsl(var(--muted-foreground))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
