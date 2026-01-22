// ABOUTME: Progress card showing writing goal completion
// ABOUTME: Displays current vs target word count with progress bar

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  isLoading?: boolean;
}

export function ProgressCard({
  title,
  current,
  target,
  unit = 'mots',
  isLoading = false,
}: ProgressCardProps) {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {current.toLocaleString('fr-FR')} / {target.toLocaleString('fr-FR')}{' '}
          {unit} ({percentage.toFixed(0)}%)
        </p>
      </CardContent>
    </Card>
  );
}
