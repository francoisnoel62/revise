// ABOUTME: Empty state displayed when user has no projects.
// ABOUTME: Encourages creating first project.

'use client';

import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateProject: () => void;
  isCreating: boolean;
}

export function EmptyState({ onCreateProject, isCreating }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Create your first project to start writing. You can also import an existing
        document from the editor.
      </p>
      <Button onClick={onCreateProject} disabled={isCreating}>
        <Plus className="h-4 w-4 mr-2" />
        {isCreating ? 'Creating...' : 'Create your first project'}
      </Button>
    </div>
  );
}
