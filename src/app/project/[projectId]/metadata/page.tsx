// ABOUTME: Metadata list page for a project.
// ABOUTME: Shows existing metadata and allows generating/regenerating all analysis types.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetadataCard } from '@/components/metadata/MetadataCard';
import { GenerateCard } from '@/components/metadata/GenerateCard';
import {
  MetadataListItem,
  listMetadataAction,
  generateNarrativeAnalysisAction,
  generateStylisticDNAAction,
  generateCharactersAction,
  generatePlotAction,
  generateWorldbuildingAction,
  generateSynthesisAction,
  generateChapterSummariesAction,
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
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Check which metadata types exist
  const hasNarrativeAnalysis = metadata.some(
    (m) => m.typeKey === 'narrative-analysis'
  );
  const hasStylisticDNA = metadata.some((m) => m.typeKey === 'stylistic-dna');
  const hasCharacters = metadata.some((m) => m.typeKey === 'characters');
  const hasPlot = metadata.some((m) => m.typeKey === 'plot');
  const hasWorldbuilding = metadata.some((m) => m.typeKey === 'worldbuilding');
  const hasSynthesis = metadata.some((m) => m.typeKey === 'synthesis');
  const hasChapterSummaries = metadata.some((m) => m.typeKey === 'chapter-summaries');

  const handleGenerateNarrativeAnalysis = async (providerId: string) => {
    if (!providerId) {
      setError('Veuillez sélectionner un provider');
      return;
    }

    setGeneratingType('narrative-analysis');
    setError(null);

    try {
      const result = await generateNarrativeAnalysisAction(projectId, providerId);

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
      setGeneratingType(null);
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

  // Handler for regenerating metadata from MetadataCard
  const handleRegenerate = async (typeKey: string, providerId: string) => {
    if (!providerId) {
      setError('Veuillez sélectionner un provider');
      return;
    }

    setGeneratingType(typeKey);
    setError(null);

    // Map typeKey to the appropriate generation action
    const actionMap: Record<string, (projectId: string, providerId: string) => Promise<{ success: boolean; error?: string; data?: { metadata: { id: string } } }>> = {
      'narrative-analysis': generateNarrativeAnalysisAction,
      'stylistic-dna': generateStylisticDNAAction,
      'characters': generateCharactersAction,
      'plot': generatePlotAction,
      'worldbuilding': generateWorldbuildingAction,
      'synthesis': generateSynthesisAction,
      'chapter-summaries': generateChapterSummariesAction,
    };

    const generateAction = actionMap[typeKey];
    if (!generateAction) {
      setError(`Type de métadonnée inconnu: ${typeKey}`);
      setGeneratingType(null);
      return;
    }

    try {
      const result = await generateAction(projectId, providerId);

      if (!result.success) {
        setError(result.error || 'Une erreur est survenue');
        return;
      }

      // Refresh metadata list
      const metadataResult = await listMetadataAction(projectId);
      if (metadataResult.success) {
        setMetadata(metadataResult.data);
      }

      // Navigate to the generated metadata
      if (result.data?.metadata?.id) {
        router.push(`/project/${projectId}/metadata/${result.data.metadata.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setGeneratingType(null);
    }
  };

  // Generic handler for all metadata generation types
  const createGenerateHandler = (
    typeKey: string,
    generateAction: (
      projectId: string,
      providerId: string
    ) => Promise<{ success: boolean; error?: string; data?: { metadata: { id: string } } }>,
    _hasExisting: boolean
  ) => {
    return async (providerId: string) => {
      if (!providerId) {
        setError('Veuillez sélectionner un provider');
        return;
      }

      setGeneratingType(typeKey); // Track which type is generating
      setError(null);

      try {
        const result = await generateAction(projectId, providerId);

        if (!result.success) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        // Refresh metadata list
        const metadataResult = await listMetadataAction(projectId);
        if (metadataResult.success) {
          setMetadata(metadataResult.data);
        }

        // Navigate to the generated metadata
        if (result.data?.metadata?.id) {
          router.push(`/project/${projectId}/metadata/${result.data.metadata.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
      } finally {
        setGeneratingType(null); // Clear generating state
      }
    };
  };

  const handleGenerateStylisticDNA = createGenerateHandler(
    'stylistic-dna',
    generateStylisticDNAAction,
    hasStylisticDNA
  );

  const handleGenerateCharacters = createGenerateHandler(
    'characters',
    generateCharactersAction,
    hasCharacters
  );

  const handleGeneratePlot = createGenerateHandler(
    'plot',
    generatePlotAction,
    hasPlot
  );

  const handleGenerateWorldbuilding = createGenerateHandler(
    'worldbuilding',
    generateWorldbuildingAction,
    hasWorldbuilding
  );

  const handleGenerateSynthesis = createGenerateHandler(
    'synthesis',
    generateSynthesisAction,
    hasSynthesis
  );

  const handleGenerateChapterSummaries = createGenerateHandler(
    'chapter-summaries',
    generateChapterSummariesAction,
    hasChapterSummaries
  );

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
  const stylisticDNAType = getMetadataType('stylistic-dna');
  const charactersType = getMetadataType('characters');
  const plotType = getMetadataType('plot');
  const worldbuildingType = getMetadataType('worldbuilding');
  const synthesisType = getMetadataType('synthesis');
  const chapterSummariesType = getMetadataType('chapter-summaries');

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
              providers={providers}
              defaultProviderId={projectProviderId}
              onRegenerate={handleRegenerate}
              isRegenerating={generatingType === m.typeKey}
            />
          ))}

          {/* Generate Narrative Analysis card (only if doesn't exist) */}
          {narrativeType && !hasNarrativeAnalysis && (
            <GenerateCard
              typeKey="narrative-analysis"
              title={narrativeType.name}
              description={narrativeType.description}
              isGenerating={generatingType === 'narrative-analysis'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateNarrativeAnalysis}
            />
          )}

          {/* Generate Stylistic DNA card (only if doesn't exist) */}
          {stylisticDNAType && !hasStylisticDNA && (
            <GenerateCard
              typeKey="stylistic-dna"
              title={stylisticDNAType.name}
              description={stylisticDNAType.description}
              isGenerating={generatingType === 'stylistic-dna'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateStylisticDNA}
            />
          )}

          {/* Generate Characters card (only if doesn't exist) */}
          {charactersType && !hasCharacters && (
            <GenerateCard
              typeKey="characters"
              title={charactersType.name}
              description={charactersType.description}
              isGenerating={generatingType === 'characters'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateCharacters}
            />
          )}

          {/* Generate Plot card (only if doesn't exist) */}
          {plotType && !hasPlot && (
            <GenerateCard
              typeKey="plot"
              title={plotType.name}
              description={plotType.description}
              isGenerating={generatingType === 'plot'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGeneratePlot}
            />
          )}

          {/* Generate Worldbuilding card (only if doesn't exist) */}
          {worldbuildingType && !hasWorldbuilding && (
            <GenerateCard
              typeKey="worldbuilding"
              title={worldbuildingType.name}
              description={worldbuildingType.description}
              isGenerating={generatingType === 'worldbuilding'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateWorldbuilding}
            />
          )}

          {/* Generate Synthesis card (only if doesn't exist) */}
          {synthesisType && !hasSynthesis && (
            <GenerateCard
              typeKey="synthesis"
              title={synthesisType.name}
              description={synthesisType.description}
              isGenerating={generatingType === 'synthesis'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateSynthesis}
            />
          )}

          {/* Generate Chapter Summaries card (only if doesn't exist) */}
          {chapterSummariesType && !hasChapterSummaries && (
            <GenerateCard
              typeKey="chapter-summaries"
              title={chapterSummariesType.name}
              description={chapterSummariesType.description}
              isGenerating={generatingType === 'chapter-summaries'}
              isAnyGenerating={generatingType !== null}
              providers={providers}
              defaultProviderId={projectProviderId}
              onGenerate={handleGenerateChapterSummaries}
            />
          )}
        </div>

        {metadata.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            Aucune métadonnée. Générez une analyse narrative pour commencer.
          </p>
        )}
      </main>
    </div>
  );
}
