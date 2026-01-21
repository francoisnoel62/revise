// ABOUTME: Server Actions for AI Chapter Generation.
// ABOUTME: Delegates to GenerateChapterUseCase for generating chapter content.

'use server';

import { GenerateChapterUseCase } from '@/application/use-cases/GenerateChapterUseCase';
import { ChapterGenerationTypeKey, isValidChapterGenerationType } from '@/domain';
import { TipTapContentService } from '@/infrastructure/document/utils/TipTapContentService';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getMetadataRepo,
  getTrackedLLMProviderForProject,
  getTrackedLLMProviderById,
  withErrorHandling,
} from './utils';
import { canGenerateMetadata, recordMetadataGeneration } from './rate-limiter';

/**
 * Result of chapter generation.
 */
export interface ChapterGenerationResult {
  tipTapContent: string;
  narrativeContext?: string;
  suggestions?: string[];
}

/**
 * Generate chapter content using AI.
 * Uses all available project metadata for context.
 *
 * @param projectId The project to generate content for
 * @param generationType Type of generation: 'chapter-beginning', 'chapter-full', or 'chapter-outline'
 * @param providerId Optional specific provider to use
 * @returns Generated TipTap JSON content ready to insert
 */
export async function generateChapterAction(
  projectId: string,
  generationType: string,
  providerId?: string
): Promise<ActionResult<ChapterGenerationResult>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // 2. Validate generation type
  if (!isValidChapterGenerationType(generationType)) {
    return {
      success: false,
      error: `Invalid generation type: ${generationType}`,
    };
  }

  // 3. Rate limit check (using same rate limiter as metadata)
  const rateCheck = canGenerateMetadata(auth.userId, `chapter-${generationType}`);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez attendre ${rateCheck.waitSeconds} secondes avant de générer à nouveau.`,
    };
  }

  return withErrorHandling(async () => {
    // 4. Record generation attempt
    recordMetadataGeneration(auth.userId, `chapter-${generationType}`);

    // 5. Get LLM provider with usage tracking
    const llmProvider = providerId
      ? await getTrackedLLMProviderById(auth.userId, providerId, projectId)
      : await getTrackedLLMProviderForProject(auth.userId, projectId);

    // 6. Execute use case with injected dependencies
    const contentConverter = new TipTapContentService();
    const useCase = new GenerateChapterUseCase(
      await getRepository(),
      await getMetadataRepo(),
      llmProvider,
      contentConverter
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      generationType: generationType as ChapterGenerationTypeKey,
    });

    // 7. Return serialized result
    return {
      tipTapContent: result.editorContent,
      narrativeContext: result.generation.narrativeContext,
      suggestions: result.generation.suggestions,
    };
  });
}
