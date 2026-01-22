// ABOUTME: Tasks page for managing project tasks
// ABOUTME: Displays task table with filtering, creation, and editing

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  listTasksAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskStatusAction,
  getProjectTagsAction,
  getTaskSummaryAction,
  SerializedProjectTask,
} from '@/app/actions/task-actions';
import { loadProjectAction } from '@/app/actions/project-actions';
import { TaskForm, TaskRow, TaskSummaryCard } from '@/components/cockpit';
import { TaskSummary } from '@/application/use-cases/GetTaskSummaryUseCase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';
import { TaskStatus, TASK_STATUS_LABELS } from '@/domain/value-objects/TaskStatus';
import { TaskPriority, TASK_PRIORITY_LABELS } from '@/domain/value-objects/TaskPriority';

export default function TasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [tasks, setTasks] = useState<SerializedProjectTask[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [chapters, setChapters] = useState<Array<{ id: string; title: string }>>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<SerializedProjectTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: { status?: TaskStatus; priority?: TaskPriority } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;

      const [tasksResult, summaryResult, projectResult, tagsResult] = await Promise.all([
        listTasksAction(projectId, {
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        }),
        getTaskSummaryAction(projectId),
        loadProjectAction(projectId),
        getProjectTagsAction(projectId),
      ]);

      if (tasksResult.success) {
        setTasks(tasksResult.tasks);
      }

      if (summaryResult.success) {
        setSummary(summaryResult.summary);
      }

      if (projectResult.success) {
        setChapters(
          projectResult.data.chapters.map((ch) => ({
            id: ch.id,
            title: ch.title,
          }))
        );
      }

      if (tagsResult.success) {
        setExistingTags(tagsResult.tags);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    linkedChapterId?: string;
    tags?: string[];
  }) => {
    setIsCreating(true);
    try {
      const result = await createTaskAction(projectId, data.title, {
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        linkedChapterId: data.linkedChapterId,
        tags: data.tags,
      });

      if (result.success) {
        setShowCreateForm(false);
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTask = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    linkedChapterId?: string;
    tags?: string[];
  }) => {
    if (!editingTask) return;

    try {
      const result = await updateTaskAction(editingTask.id, {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
        linkedChapterId: data.linkedChapterId || null,
        tags: data.tags,
      });

      if (result.success) {
        setEditingTask(null);
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    const result = await toggleTaskStatusAction(taskId);
    if (result.success) {
      await loadData();
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;

    const result = await deleteTaskAction(deletingTaskId);
    if (result.success) {
      setDeletingTaskId(null);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-muted-foreground">Gérez les tâches de votre projet</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Summary Card */}
      <TaskSummaryCard summary={summary} isLoading={isLoading} />

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune tâche trouvée.</p>
          <p className="text-sm mt-1">
            Créez une première tâche pour commencer à suivre votre travail.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 w-10"></th>
                <th className="p-4 text-left font-medium">Titre</th>
                <th className="p-4 text-left font-medium">Statut</th>
                <th className="p-4 text-left font-medium">Priorité</th>
                <th className="p-4 text-left font-medium">Échéance</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggleStatus={handleToggleStatus}
                  onEdit={setEditingTask}
                  onDelete={setDeletingTaskId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Sheet */}
      <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle tâche</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TaskForm
              onSubmit={handleCreateTask}
              chapters={chapters}
              existingTags={existingTags}
              isLoading={isCreating}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Task Sheet */}
      <Sheet open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier la tâche</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingTask && (
              <TaskForm
                onSubmit={handleUpdateTask}
                initialValues={editingTask}
                chapters={chapters}
                existingTags={existingTags}
                submitLabel="Enregistrer"
                onCancel={() => setEditingTask(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
