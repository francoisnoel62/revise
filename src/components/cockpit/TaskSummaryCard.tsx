// ABOUTME: Card showing task statistics summary
// ABOUTME: Displays counts by status with visual indicators

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { TaskSummary } from '@/application/use-cases/GetTaskSummaryUseCase';

interface TaskSummaryCardProps {
  summary: TaskSummary | null;
  isLoading?: boolean;
}

export function TaskSummaryCard({ summary, isLoading }: TaskSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune tâche</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tâches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="space-y-1">
            <Circle className="h-5 w-5 mx-auto text-gray-400" />
            <div className="text-lg font-bold">{summary.todo}</div>
            <div className="text-xs text-muted-foreground">À faire</div>
          </div>
          <div className="space-y-1">
            <Clock className="h-5 w-5 mx-auto text-blue-500" />
            <div className="text-lg font-bold">{summary.inProgress}</div>
            <div className="text-xs text-muted-foreground">En cours</div>
          </div>
          <div className="space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-500" />
            <div className="text-lg font-bold">{summary.done}</div>
            <div className="text-xs text-muted-foreground">Terminées</div>
          </div>
          <div className="space-y-1">
            <AlertTriangle className="h-5 w-5 mx-auto text-red-500" />
            <div className="text-lg font-bold">{summary.overdue}</div>
            <div className="text-xs text-muted-foreground">En retard</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
