// ABOUTME: Server Action for generating AI rewrite proposals.
// ABOUTME: Requires user-configured provider (no default fallback).

'use server';

import { RewriteTextUseCase } from '@/application';
import {
  getProviderRepository,
  getProjectRepository,
  createLLMProvider,
} from '@/infrastructure/config/providers';
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
 *
 * @param projectId The project ID (to determine which provider to use)
 * @param fullContent Full document content (TipTap JSON string) for context
 * @param selectionStart Selection start position (for reference)
 * @param selectionEnd Selection end position (for reference)
 * @param selectedText The actual selected text extracted from TipTap editor
 * @returns Action result with proposals or error
 */
export async function rewriteText(
  projectId: string,
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

    // 3. Load project to get providerId
    const projectRepo = await getProjectRepository();
    const project = await projectRepo.loadProject(userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // 4. Get LLM provider - requires user-configured provider
    if (!project.getProviderId()) {
      throw new Error(
        'Aucun fournisseur IA configuré pour ce projet. Veuillez en sélectionner un dans les paramètres du projet.'
      );
    }

    const providerRepo = await getProviderRepository();
    const provider = await providerRepo.findById(userId, project.getProviderId()!);

    if (!provider) {
      throw new Error(
        'Le fournisseur IA configuré est introuvable. Veuillez en sélectionner un autre.'
      );
    }

    if (!provider.isValidProvider()) {
      throw new Error(
        'Le fournisseur IA configuré est invalide. Veuillez tester la connexion ou en choisir un autre.'
      );
    }

    const llmProvider = createLLMProvider(provider);

    // 5. Extract plain text context from TipTap JSON for AI
    let plainTextContext = '';
    try {
      const tiptapJson = JSON.parse(fullContent);
      plainTextContext = extractTextFromTipTapJSON(tiptapJson);
    } catch {
      // If parsing fails, use fullContent as-is (fallback for plain text)
      plainTextContext = fullContent;
    }

    // 6. Execute rewrite use case with extracted text (avoids JSON/position mismatch)
    const useCase = new RewriteTextUseCase(llmProvider);
    const proposals = await useCase.executeWithText(selectedText, plainTextContext);

    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Rewrite] Completed in ${duration.toFixed(2)}ms`);
    }

    // 6. Convert to DTOs
    return proposals.map((p) => ({
      content: p.content,
      styleLabel: p.styleLabel,
    }));
  });
}
