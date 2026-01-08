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
import { ProjectListItem, listProjectsAction, createProjectAction } from '@/app/actions/project-actions';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateProject = async () => {
    setIsCreating(true);
    setError(null);

    const result = await createProjectAction();

    if (!result.success) {
      setError(result.error);
      setIsCreating(false);
      return;
    }

    // Navigate to new project
    router.push(`/?project=${result.data.id}`);
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/?project=${projectId}`);
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
          <p className="text-muted-foreground">Loading projects...</p>
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
              <h1 className="text-2xl font-bold">My Projects</h1>
              <p className="text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'New Project'}
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
          <EmptyState onCreateProject={handleCreateProject} isCreating={isCreating} />
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
    </div>
  );
}
