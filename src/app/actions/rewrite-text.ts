// ABOUTME: Server Action for generating AI rewrite proposals.
// ABOUTME: Requires user-configured provider (no default fallback).
// ABOUTME: Automatically saves proposals to correction history.

'use server';

import { RewriteTextUseCase } from '@/application';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { SaveCorrectionHistoryUseCase } from '@/application/use-cases/SaveCorrectionHistoryUseCase';
import {
  getProjectRepository,
  getCorrectionHistoryRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderForProject, getMetadataRepo } from './utils';
import { uuidGenerator } from '@/infrastructure/utils/UUIDGenerator';
import { extractTextFromTipTapJSON } from '@/infrastructure/document/utils/tiptap-conversion';
import {
  ActionResult,
  getAuthenticatedUserId,
  withErrorHandling,
} from './utils';

interface RewriteProposalDTO {
  content: string;
  styleLabel?: string;
}

/**
 * Rewrite selected text using AI.
 *
 * Requires a user-configured provider for the project.
 * Throws an error if no provider is configured.
 * Automatically saves proposals to correction history.
 *
 * @param projectId The project ID (to determine which provider to use)
 * @param chapterId The chapter ID where the selection was made
 * @param fullContent Full document content (TipTap JSON string) for context
 * @param selectionStart Selection start position (for reference)
 * @param selectionEnd Selection end position (for reference)
 * @param selectedText The actual selected text extracted from TipTap editor
 * @returns Action result with proposals or error
 */
export async function rewriteText(
  projectId: string,
  chapterId: string,
  fullContent: string,
  selectionStart: number,
  selectionEnd: number,
  selectedText: string
): Promise<ActionResult<RewriteProposalDTO[]>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate input
  if (!selectedText || selectedText.trim().length === 0) {
    return { success: false, error: 'Selected text is required' };
  }

  if (!fullContent || fullContent.trim().length === 0) {
    return { success: false, error: 'Content is required' };
  }

  if (selectionStart < 0 || selectionStart >= selectionEnd) {
    return { success: false, error: 'Invalid selection range' };
  }

  return withErrorHandling(async () => {
    const startTime = performance.now();

    // 3. Get LLM provider with usage tracking
    const llmProvider = await getTrackedLLMProviderForProject(userId, projectId);

    // 4. Build author profile context block (non-blocking if unavailable)
    let authorProfile = '';
    try {
      const metadataRepo = await getMetadataRepo();
      const contextBuilder = new AIContextBuilder(metadataRepo);
      authorProfile = await contextBuilder.buildRewriteContext(userId, projectId);
    } catch {
      // Continue without context if loading fails
    }

    // 5. Load project for history saving
    const projectRepo = await getProjectRepository();
    const project = await projectRepo.loadProject(userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // 6. Extract plain text context from TipTap JSON for AI
    let plainTextContext = '';
    try {
      const tiptapJson = JSON.parse(fullContent);
      plainTextContext = extractTextFromTipTapJSON(tiptapJson);
    } catch {
      // If parsing fails, use fullContent as-is (fallback for plain text)
      plainTextContext = fullContent;
    }

    // 7. Execute rewrite use case with extracted text (avoids JSON/position mismatch)
    const useCase = new RewriteTextUseCase(llmProvider);
    const proposals = await useCase.executeWithText(selectedText, plainTextContext, authorProfile);

    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Rewrite] Completed in ${duration.toFixed(2)}ms`);
    }

    // 8. Save to correction history (non-blocking, don't fail if this fails)
    try {
      const historyRepo = await getCorrectionHistoryRepository();
      const saveHistoryUseCase = new SaveCorrectionHistoryUseCase(
        historyRepo,
        projectRepo,
        uuidGenerator
      );

      await saveHistoryUseCase.execute({
        ownerId: userId,
        projectId,
        chapterId,
        selectedText,
        proposals: proposals.map((p) => p.content),
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[Rewrite] History saved successfully');
      }
    } catch (historyError) {
      // Log but don't fail the rewrite operation
      console.error('[Rewrite] Failed to save history:', historyError);
    }

    // 9. Convert to DTOs
    return proposals.map((p) => ({
      content: p.content,
      styleLabel: p.styleLabel,
    }));
  });
}
