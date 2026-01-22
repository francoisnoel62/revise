// ABOUTME: Cockpit metadata list page for a project.
// ABOUTME: Shows existing metadata and allows generating/regenerating all analysis types.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetadataCard } from '@/components/metadata/MetadataCard';
import { GenerateCard } from '@/components/metadata/GenerateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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

export default function CockpitMetadataListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [projectProviderId, setProjectProviderId] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<MetadataListItem[]>([]);
  const [providers, setProviders] = useState<SafeProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Load project provider setting
      const projectResult = await loadProjectAction(projectId);
      if (!projectResult.success) {
        if (projectResult.redirect) {
          router.push(projectResult.redirect);
          return;
        }
        setLoadError(projectResult.error);
        return;
      }
      setProjectProviderId(projectResult.data.providerId || undefined);

      // Load metadata
      const metadataResult = await listMetadataAction(projectId);
      if (!metadataResult.success) {
        setLoadError(metadataResult.error);
        return;
      }
      setMetadata(metadataResult.data);

      // Load providers
      const providersResult = await listProvidersAction();
      if (providersResult.success) {
        setProviders(providersResult.data);
      }
    } catch {
      setLoadError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleOpenMetadata = (metadataId: string) => {
    router.push(`/project/${projectId}/cockpit/metadata/${metadataId}`);
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
      setActionError('Veuillez sélectionner un provider');
      return;
    }

    setGeneratingType(typeKey);
    setActionError(null);

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
      setActionError(`Type de métadonnée inconnu: ${typeKey}`);
      setGeneratingType(null);
      return;
    }

    try {
      const result = await generateAction(projectId, providerId);

      if (!result.success) {
        setActionError(result.error || 'Une erreur est survenue');
        return;
      }

      // Refresh metadata list
      const metadataResult = await listMetadataAction(projectId);
      if (metadataResult.success) {
        setMetadata(metadataResult.data);
      }

      // Navigate to the generated metadata (stay in cockpit)
      if (result.data?.metadata?.id) {
        router.push(`/project/${projectId}/cockpit/metadata/${result.data.metadata.id}`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors de la génération');
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
    ) => Promise<{ success: boolean; error?: string; data?: { metadata: { id: string } } }>
  ) => {
    return async (providerId: string) => {
      if (!providerId) {
        setActionError('Veuillez sélectionner un provider');
        return;
      }

      setGeneratingType(typeKey);
      setActionError(null);

      try {
        const result = await generateAction(projectId, providerId);

        if (!result.success) {
          setActionError(result.error || 'Une erreur est survenue');
          return;
        }

        // Refresh metadata list
        const metadataResult = await listMetadataAction(projectId);
        if (metadataResult.success) {
          setMetadata(metadataResult.data);
        }

        // Navigate to the generated metadata (stay in cockpit)
        if (result.data?.metadata?.id) {
          router.push(`/project/${projectId}/cockpit/metadata/${result.data.metadata.id}`);
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erreur lors de la génération');
      } finally {
        setGeneratingType(null);
      }
    };
  };

  const handleGenerateNarrativeAnalysis = createGenerateHandler(
    'narrative-analysis',
    generateNarrativeAnalysisAction
  );

  const handleGenerateStylisticDNA = createGenerateHandler(
    'stylistic-dna',
    generateStylisticDNAAction
  );

  const handleGenerateCharacters = createGenerateHandler(
    'characters',
    generateCharactersAction
  );

  const handleGeneratePlot = createGenerateHandler(
    'plot',
    generatePlotAction
  );

  const handleGenerateWorldbuilding = createGenerateHandler(
    'worldbuilding',
    generateWorldbuildingAction
  );

  const handleGenerateSynthesis = createGenerateHandler(
    'synthesis',
    generateSynthesisAction
  );

  const handleGenerateChapterSummaries = createGenerateHandler(
    'chapter-summaries',
    generateChapterSummariesAction
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métadonnées</h1>
          <p className="text-muted-foreground">
            Analyses IA de votre manuscrit
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métadonnées</h1>
          <p className="text-muted-foreground">
            Analyses IA de votre manuscrit
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métadonnées</h1>
        <p className="text-muted-foreground">
          Analyses IA de votre manuscrit
        </p>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
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

      {metadata.length === 0 && !generatingType && (
        <p className="text-center text-muted-foreground mt-8">
          Aucune métadonnée. Générez une analyse narrative pour commencer.
        </p>
      )}
    </div>
  );
}
