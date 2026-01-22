// ABOUTME: Table row component displaying a single task
// ABOUTME: Shows status checkbox, title, priority, due date, and actions

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { SerializedProjectTask } from '@/app/actions/task-actions';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/ui-labels';
import { cn } from '@/lib/utils';

interface TaskRowProps {
  task: SerializedProjectTask;
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: SerializedProjectTask) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function TaskRow({ task, onToggleStatus, onEdit, onDelete }: TaskRowProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        task.status === 'done' && 'opacity-60'
      )}
    >
      <td className="p-4 w-10">
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={() => onToggleStatus(task.id)}
          aria-label={`Marquer "${task.title}" comme ${
            task.status === 'done' ? 'à faire' : 'terminé'
          }`}
        />
      </td>
      <td className="p-4">
        <div className="space-y-1">
          <span
            className={cn(
              'font-medium',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {task.description}
            </p>
          )}
          {task.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-secondary rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline" className={statusColors[task.status]}>
          {TASK_STATUS_LABELS[task.status]}
        </Badge>
      </td>
      <td className="p-4">
        <Badge variant="outline" className={priorityColors[task.priority]}>
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
      </td>
      <td className="p-4">
        {task.dueDate && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm',
              task.isOverdue && 'text-destructive'
            )}
          >
            {task.isOverdue && <AlertCircle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            aria-label="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
