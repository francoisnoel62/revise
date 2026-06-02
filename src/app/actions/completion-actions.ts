// ABOUTME: Server Actions for AI Text Autocompletion.
// ABOUTME: Delegates to GenerateCompletionUseCase for generating text suggestions.

'use server';

import { GenerateCompletionUseCase } from '@/application/use-cases/GenerateCompletionUseCase';
import { MetadataContextBuilder } from '@/application/services/MetadataContextBuilder';
import {
  ActionResult,
  getAuthenticatedUserId,
  getMetadataRepo,
  getTrackedLLMProviderForProject,
  withErrorHandling,
} from './utils';
import { canGenerateMetadata, recordMetadataGeneration } from './rate-limiter';

/**
 * Result of completion generation.
 */
export interface CompletionResult {
  completion: string;
}

/**
 * Generate text completion using AI.
 * Uses project metadata for context-aware suggestions.
 *
 * @param projectId The project to generate completion for
 * @param textBeforeCursor Text before the cursor position
 * @param textAfterCursor Optional text after cursor
 * @returns Generated completion text
 */
export async function generateCompletionAction(
  projectId: string,
  textBeforeCursor: string,
  textAfterCursor?: string
): Promise<ActionResult<CompletionResult>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // 2. Rate limit check (1 second cooldown for completions)
  const rateCheck = canGenerateMetadata(auth.userId, 'completion');
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Veuillez patienter avant de demander une nouvelle suggestion.`,
    };
  }

  return withErrorHandling(async () => {
    // 3. Record generation attempt
    recordMetadataGeneration(auth.userId, 'completion');

    // 4. Get LLM provider with usage tracking
    const llmProvider = await getTrackedLLMProviderForProject(auth.userId, projectId);

    // 5. Execute use case with injected dependencies via composition root
    const useCase = new GenerateCompletionUseCase(
      new MetadataContextBuilder(await getMetadataRepo()),
      llmProvider
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      textBeforeCursor,
      textAfterCursor,
    });

    // 6. Return result
    return {
      completion: result.completion,
    };
  });
}
