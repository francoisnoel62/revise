// ABOUTME: Card displaying quick action buttons for the cockpit overview
// ABOUTME: Provides one-click access to common project operations

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickActionButton } from './QuickActionButton';
import {
  Pencil,
  ListTodo,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TaskForm } from './TaskForm';
import { createTaskAction } from '@/app/actions/task-actions';
import { loadProjectAction } from '@/app/actions/project-actions';
import { addChapterAction } from '@/app/actions/chapter-actions';
import { TaskStatus } from '@/domain/value-objects/TaskStatus';
import { TaskPriority } from '@/domain/value-objects/TaskPriority';

interface QuickActionsCardProps {
  projectId: string;
  lastEditedChapterTitle: string | null;
  overdueTaskCount: number;
  hasChapters: boolean;
  onTaskCreated?: () => void;
}

export function QuickActionsCard({
  projectId,
  lastEditedChapterTitle,
  overdueTaskCount,
  hasChapters,
  onTaskCreated,
}: QuickActionsCardProps) {
  const router = useRouter();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [chapters, setChapters] = useState<Array<{ id: string; title: string }>>([]);

  const loadChapters = useCallback(async () => {
    const result = await loadProjectAction(projectId);
    if (result.success) {
      setChapters(
        result.data.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
        }))
      );
    }
  }, [projectId]);

  const handleContinueWriting = () => {
    router.push(`/editor?project=${projectId}`);
  };

  const handleNewChapter = async () => {
    const result = await addChapterAction(projectId);
    if (result.success) {
      router.push(`/editor?project=${projectId}`);
    }
  };

  const handleAddTask = async () => {
    await loadChapters();
    setShowTaskForm(true);
  };

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    linkedChapterId?: string;
    tags?: string[];
  }) => {
    setIsCreatingTask(true);
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
        setShowTaskForm(false);
        onTaskCreated?.();
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleGenerateAnalysis = () => {
    router.push(`/project/${projectId}/cockpit/settings`);
  };

  const handleViewOverdueTasks = () => {
    router.push(`/project/${projectId}/cockpit/tasks?filter=overdue`);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={Pencil}
            label="Continuer l'écriture"
            description={
              lastEditedChapterTitle
                ? `Reprendre "${lastEditedChapterTitle}"`
                : hasChapters
                  ? 'Ouvrir le projet'
                  : 'Commencer à écrire'
            }
            onClick={handleContinueWriting}
          />

          <QuickActionButton
            icon={FileText}
            label="Nouveau chapitre"
            description="Ajouter un chapitre"
            onClick={handleNewChapter}
          />

          <QuickActionButton
            icon={ListTodo}
            label="Ajouter une tâche"
            description="Créer une tâche rapide"
            onClick={handleAddTask}
          />

          <QuickActionButton
            icon={Sparkles}
            label="Analyses IA"
            description="Générer des métadonnées"
            onClick={handleGenerateAnalysis}
          />

          {overdueTaskCount > 0 && (
            <QuickActionButton
              icon={AlertCircle}
              label="Tâches en retard"
              description="Voir les tâches urgentes"
              onClick={handleViewOverdueTasks}
              badge={overdueTaskCount}
              badgeVariant="destructive"
              className="col-span-2"
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={showTaskForm} onOpenChange={setShowTaskForm}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle tâche</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TaskForm
              onSubmit={handleCreateTask}
              chapters={chapters}
              isLoading={isCreatingTask}
              onCancel={() => setShowTaskForm(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
