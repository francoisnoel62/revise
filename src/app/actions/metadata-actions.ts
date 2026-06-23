// ABOUTME: Server Actions for Project Metadata CRUD operations.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { CreateMetadataUseCase } from '@/application/use-cases/CreateMetadataUseCase';
import { LoadMetadataUseCase } from '@/application/use-cases/LoadMetadataUseCase';
import { ListMetadataUseCase } from '@/application/use-cases/ListMetadataUseCase';
import { UpdateMetadataContentUseCase } from '@/application/use-cases/UpdateMetadataContentUseCase';
import { UpdateMetadataTitleUseCase } from '@/application/use-cases/UpdateMetadataTitleUseCase';
import { DeleteMetadataUseCase } from '@/application/use-cases/DeleteMetadataUseCase';
import { GenerateMetadataUseCase } from '@/application/use-cases/GenerateMetadataUseCase';
import {
  narrativeAnalysisConfig,
  stylisticDNAConfig,
  charactersConfig,
  plotConfig,
  worldbuildingConfig,
  synthesisConfig,
  chapterSummariesConfig,
} from '@/application/use-cases/metadata-type-configs';
import { CheckMetadataFreshnessUseCase, MetadataFreshness } from '@/application/use-cases/CheckMetadataFreshnessUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getMetadataRepo,
  getIdGenerator,
  getTrackedLLMProviderForProject,
  getTrackedLLMProviderById,
  withErrorHandling,
} from './utils';
import { canGenerateMetadata, recordMetadataGeneration } from './rate-limiter';
import { metadataCache } from '@/infrastructure/cache/MetadataCache';

/**
 * Serialized metadata for client transport.
 */
export interface SerializedMetadata {
  id: string;
  projectId: string;
  typeKey: string;
  title: string;
  content: string;
  properties: {
    wordCount: number;
    characterCount: number;
    lastEdited: string;
    generatedAt: string | null;
    isGenerated: boolean;
  };
}

/**
 * Metadata list item (lighter than full metadata).
 */
export interface MetadataListItem {
  id: string;
  typeKey: string;
  title: string;
  wordCount: number;
  isGenerated: boolean;
  lastEdited: string;
}

// === Serialization Helpers ===

function serializeMetadata(metadata: ProjectMetadata): SerializedMetadata {
  const props = metadata.getProperties();
  return {
    id: metadata.getId(),
    projectId: metadata.getProjectId(),
    typeKey: metadata.getTypeKey(),
    title: metadata.getTitle(),
    content: metadata.getContent(),
    properties: {
      wordCount: props.wordCount,
      characterCount: props.characterCount,
      lastEdited: props.lastEdited.toISOString(),
      generatedAt: props.generatedAt?.toISOString() ?? null,
      isGenerated: props.isGenerated,
    },
  };
}

function serializeMetadataListItem(metadata: ProjectMetadata): MetadataListItem {
  const props = metadata.getProperties();
  return {
    id: metadata.getId(),
    typeKey: metadata.getTypeKey(),
    title: metadata.getTitle(),
    wordCount: props.wordCount,
    isGenerated: props.isGenerated,
    lastEdited: props.lastEdited.toISOString(),
  };
}

// === Server Actions ===

/**
 * Create a new metadata document.
 */
export async function createMetadataAction(
  projectId: string,
  typeKey: string,
  title?: string
): Promise<ActionResult<SerializedMetadata>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CreateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      await getIdGenerator()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      typeKey,
      title,
    });

    return serializeMetadata(result.metadata);
  });
}

/**
 * Load a metadata document by ID.
 */
export async function loadMetadataAction(
  metadataId: string
): Promise<ActionResult<SerializedMetadata>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new LoadMetadataUseCase(await getMetadataRepo());

    const result = await useCase.execute({
      ownerId: auth.userId,
      metadataId,
    });

    return serializeMetadata(result.metadata);
  });
}

/**
 * List all metadata for a project.
 */
export async function listMetadataAction(
  projectId: string
): Promise<ActionResult<MetadataListItem[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListMetadataUseCase(
      await getMetadataRepo(),
      await getRepository()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    return result.metadata.map(serializeMetadataListItem);
  });
}

/**
 * Update metadata content.
 */
export async function updateMetadataContentAction(
  metadataId: string,
  content: string,
  projectId?: string
): Promise<ActionResult<{ saved: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateMetadataContentUseCase(await getMetadataRepo());

    await useCase.execute({
      ownerId: auth.userId,
      metadataId,
      content,
    });

    // Invalidate cache when metadata content changes
    if (projectId) {
      metadataCache.invalidate(auth.userId, projectId);
    } else {
      // If no projectId provided, invalidate all user's cache
      metadataCache.invalidateUser(auth.userId);
    }

    return { saved: true };
  });
}

/**
 * Update metadata title.
 */
export async function updateMetadataTitleAction(
  metadataId: string,
  title: string
): Promise<ActionResult<SerializedMetadata>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateMetadataTitleUseCase(await getMetadataRepo());

    const result = await useCase.execute({
      ownerId: auth.userId,
      metadataId,
      title,
    });

    return serializeMetadata(result.metadata);
  });
}

/**
 * Delete a metadata document.
 */
export async function deleteMetadataAction(
  metadataId: string,
  projectId?: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new DeleteMetadataUseCase(await getMetadataRepo());

    await useCase.execute({
      ownerId: auth.userId,
      metadataId,
    });

    // Invalidate cache when metadata is deleted
    if (projectId) {
      metadataCache.invalidate(auth.userId, projectId);
    } else {
      metadataCache.invalidateUser(auth.userId);
    }

    return { deleted: true };
  });
}

/**
 * Generate narrative analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateNarrativeAnalysisAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // Check rate limit
  const rateCheck = canGenerateMetadata(auth.userId, 'narrative-analysis');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    // Record generation attempt
    recordMetadataGeneration(auth.userId, 'narrative-analysis');

    // Get LLM provider: use specified provider or project's default
    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      narrativeAnalysisConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate stylistic DNA analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateStylisticDNAAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'stylistic-dna');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'stylistic-dna');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      stylisticDNAConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate character analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateCharactersAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'characters');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'characters');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      charactersConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate plot analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generatePlotAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'plot');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'plot');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      plotConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate worldbuilding analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateWorldbuildingAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'worldbuilding');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'worldbuilding');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      worldbuildingConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate synthesis analysis for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateSynthesisAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'synthesis');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'synthesis');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      synthesisConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Generate chapter summaries for a project.
 * Creates new metadata or updates existing.
 * @param projectId - The project ID
 * @param providerId - Optional provider ID to use for generation. If not provided, uses project's default provider.
 */
export async function generateChapterSummariesAction(
  projectId: string,
  providerId?: string
): Promise<
  ActionResult<{ metadata: SerializedMetadata; wasUpdated: boolean; wasCached: boolean }>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  const rateCheck = canGenerateMetadata(auth.userId, 'chapter-summaries');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de régénérer cette analyse.`,
    };
  }

  return withErrorHandling(async () => {
    recordMetadataGeneration(auth.userId, 'chapter-summaries');

    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    const useCase = new GenerateMetadataUseCase(
      await getMetadataRepo(),
      await getRepository(),
      llmProvider,
      await getIdGenerator(),
      chapterSummariesConfig
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Invalidate cache when metadata is regenerated
    if (!result.wasCached) {
      metadataCache.invalidate(auth.userId, projectId);
    }

    return {
      metadata: serializeMetadata(result.metadata),
      wasUpdated: result.wasUpdated,
      wasCached: result.wasCached,
    };
  });
}

/**
 * Check, per metadata, whether a generated analysis lags behind the current manuscript.
 * Read-only: never regenerates. Returns isStale flags for the metadata cockpit to surface.
 */
export async function checkMetadataFreshnessAction(
  projectId: string
): Promise<ActionResult<MetadataFreshness[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CheckMetadataFreshnessUseCase(
      await getMetadataRepo(),
      await getRepository()
    );

    return useCase.execute({ ownerId: auth.userId, projectId });
  });
}
