// ABOUTME: Project dashboard page showing user's projects.
// ABOUTME: Allows creating, opening, renaming, and deleting projects.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { NoProvidersAlert } from '@/components/dashboard/NoProvidersAlert';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { ProjectListItem, listProjectsAction, createProjectAction } from '@/app/actions/project-actions';
import { importDocument } from '@/app/actions';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      const result = await listProjectsAction();

      if (!result.success) {
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }
        setError(result.error);
      } else {
        setProjects(result.data);
      }

      setIsLoading(false);
    }

    loadProjects();
  }, [router]);

  const handleCreateProject = async (title: string, file: File | null) => {
    setIsCreating(true);
    setError(null);

    try {
      let projectId: string;

      if (file) {
        // Import file and create project from it
        const formData = new FormData();
        formData.append('file', file);
        const result = await importDocument(formData);

        if (!result.success) {
          if (result.redirect) {
            router.push(result.redirect);
            return;
          }
          throw new Error(result.error);
        }

        projectId = result.data.id;
      } else {
        // Create empty project with title
        const result = await createProjectAction(title);

        if (!result.success) {
          if (result.redirect) {
            router.push(result.redirect);
            return;
          }
          throw new Error(result.error);
        }

        projectId = result.data.id;
      }

      // Close dialog and navigate to new project
      setIsDialogOpen(false);
      router.push(`/editor?project=${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/editor?project=${projectId}`);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleProjectRenamed = (projectId: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p))
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mes projets</h1>
              <p className="text-muted-foreground">
                {projects.length} projet{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* No Providers Alert */}
        <div className="mb-6">
          <NoProvidersAlert />
        </div>

        {projects.length === 0 ? (
          <EmptyState onCreateProject={handleOpenDialog} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpenProject}
                onDeleted={handleProjectDeleted}
                onRenamed={handleProjectRenamed}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateProject={handleCreateProject}
        isCreating={isCreating}
      />
    </div>
  );
}
