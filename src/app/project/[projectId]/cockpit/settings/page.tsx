// ABOUTME: Project settings page for managing project parameters
// ABOUTME: Handles title, cover, narration settings, contributors, etc.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  loadProjectSettingsAction,
  createProjectSettingsAction,
  SerializedProjectSettings,
} from '@/app/actions/project-settings-actions';
import { loadProjectAction } from '@/app/actions/project-actions';
import { ProjectSettingsForm } from '@/components/cockpit/ProjectSettingsForm';
import { AutocompletePreferencesCard } from '@/components/cockpit/AutocompletePreferencesCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [settings, setSettings] = useState<SerializedProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to load existing settings
      const settingsResult = await loadProjectSettingsAction(projectId);

      if (!settingsResult.success) {
        setError(settingsResult.error);
        return;
      }

      if (settingsResult.settings) {
        setSettings(settingsResult.settings);
      } else {
        // Settings don't exist, create them with project title
        const projectResult = await loadProjectAction(projectId);

        if (!projectResult.success || !projectResult.data) {
          setError('Projet non trouvé');
          return;
        }

        // Create new settings with project title
        const createResult = await createProjectSettingsAction(
          projectId,
          projectResult.data.title
        );

        if (!createResult.success) {
          setError(createResult.error);
          return;
        }

        setSettings(createResult.settings);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres de votre projet
          </p>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres de votre projet
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les informations et paramètres de votre projet
        </p>
      </div>

      <ProjectSettingsForm
        projectId={projectId}
        initialSettings={settings}
      />

      <AutocompletePreferencesCard
        projectId={projectId}
        initialPreferences={settings.autocompletePreferences}
      />
    </div>
  );
}
