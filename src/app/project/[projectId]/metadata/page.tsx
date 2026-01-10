// ABOUTME: Metadata list page for a project.
// ABOUTME: Shows existing metadata and allows generating narrative analysis.

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetadataCard } from '@/components/metadata/MetadataCard';
import { GenerateCard } from '@/components/metadata/GenerateCard';
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
  MetadataListItem,
  listMetadataAction,
  generateNarrativeAnalysisAction,
} from '@/app/actions/metadata-actions';
import { loadProjectAction } from '@/app/actions/project-actions';
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';
import { getMetadataType } from '@/domain';

export default function MetadataListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [projectTitle, setProjectTitle] = useState('');
  const [projectProviderId, setProjectProviderId] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<MetadataListItem[]>([]);
  const [providers, setProviders] = useState<SafeProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const pendingProviderIdRef = useRef<string>(''); // Store provider ID immediately without state delay

  // Load project, metadata, and providers on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      // Load project title and provider
      const projectResult = await loadProjectAction(projectId);
      if (!projectResult.success) {
        if (projectResult.redirect) {
          router.push(projectResult.redirect);
          return;
        }
        setError(projectResult.error);
        setIsLoading(false);
        return;
      }
      setProjectTitle(projectResult.data.title);
      setProjectProviderId(projectResult.data.providerId || undefined);

      // Load metadata
      const metadataResult = await listMetadataAction(projectId);
      if (!metadataResult.success) {
        setError(metadataResult.error);
      } else {
        setMetadata(metadataResult.data);
      }

      // Load providers
      const providersResult = await listProvidersAction();
      if (providersResult.success) {
        setProviders(providersResult.data);
      }

      setIsLoading(false);
    }

    loadData();
  }, [projectId, router]);

  // Check if narrative analysis exists
  const hasNarrativeAnalysis = metadata.some(
    (m) => m.typeKey === 'narrative-analysis'
  );

  const handleGenerateNarrativeAnalysis = async (providerId: string) => {
    // Store the selected provider ID immediately (no state delay)
    pendingProviderIdRef.current = providerId;
    setSelectedProviderId(providerId);

    // If already exists, show confirmation dialog
    if (hasNarrativeAnalysis) {
      setShowRegenerateDialog(true);
      return;
    }

    // Generate immediately with the provided ID
    await doGenerate(providerId);
  };

  const doGenerate = async (providerId?: string) => {
    // Use the provided providerId or fall back to the state
    const providerToUse = providerId || selectedProviderId;

    if (!providerToUse) {
      setError('Veuillez sélectionner un provider');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowRegenerateDialog(false);

    try {
      const result = await generateNarrativeAnalysisAction(projectId, providerToUse);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Refresh metadata list
      const metadataResult = await listMetadataAction(projectId);
      if (metadataResult.success) {
        setMetadata(metadataResult.data);
      }

      // Navigate to the generated metadata
      router.push(`/project/${projectId}/metadata/${result.data.metadata.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenMetadata = (metadataId: string) => {
    router.push(`/project/${projectId}/metadata/${metadataId}`);
  };

  const handleMetadataDeleted = (metadataId: string) => {
    setMetadata((prev) => prev.filter((m) => m.id !== metadataId));
  };

  const handleMetadataRenamed = (metadataId: string, newTitle: string) => {
    setMetadata((prev) =>
      prev.map((m) => (m.id === metadataId ? { ...m, title: newTitle } : m))
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const narrativeType = getMetadataType('narrative-analysis');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Métadonnées</h1>
              <p className="text-muted-foreground">{projectTitle}</p>
            </div>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Existing metadata cards */}
          {metadata.map((m) => (
            <MetadataCard
              key={m.id}
              metadata={m}
              onOpen={handleOpenMetadata}
              onDeleted={handleMetadataDeleted}
              onRenamed={handleMetadataRenamed}
            />
          ))}

          {/* Generate or Regenerate Narrative Analysis card */}
          {narrativeType && (
            <GenerateCard
              typeKey="narrative-analysis"
              title={hasNarrativeAnalysis ? `Régénérer ${narrativeType.name}` : narrativeType.name}
              description={
                hasNarrativeAnalysis
                  ? 'Générer une nouvelle analyse narrative. Cela remplacera l\'analyse existante.'
                  : narrativeType.description
              }
              isGenerating={isGenerating}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateNarrativeAnalysis}
            />
          )}
        </div>

        {metadata.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            Aucune métadonnée. Générez une analyse narrative pour commencer.
          </p>
        )}
      </main>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Régénérer l&apos;analyse narrative ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action remplacera l&apos;analyse existante par une nouvelle génération.
              Toutes les modifications manuelles seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doGenerate(pendingProviderIdRef.current)}
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération...' : 'Régénérer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
