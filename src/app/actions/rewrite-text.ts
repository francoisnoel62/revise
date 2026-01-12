// ABOUTME: Server Action for generating AI rewrite proposals.
// ABOUTME: Requires user-configured provider (no default fallback).

'use server';

import { RewriteTextUseCase } from '@/application';
import { TextDocument, TextSelection } from '@/domain';
import {
  getProviderRepository,
  getProjectRepository,
  createLLMProvider,
} from '@/infrastructure/config/providers';
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
 * @param fullContent Full document content for context
 * @param selectionStart Selection start position
 * @param selectionEnd Selection end position
 * @returns Action result with proposals or error
 */
export async function rewriteText(
  projectId: string,
  fullContent: string,
  selectionStart: number,
  selectionEnd: number
): Promise<ActionResult<RewriteProposalDTO[]>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate input
  if (!fullContent || fullContent.trim().length === 0) {
    return { success: false, error: 'Content is required' };
  }

  if (selectionStart < 0 || selectionEnd > fullContent.length || selectionStart >= selectionEnd) {
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

    // 5. Execute rewrite use case
    const document = new TextDocument(fullContent);
    const selection = new TextSelection(selectionStart, selectionEnd);
    const useCase = new RewriteTextUseCase(llmProvider);
    const proposals = await useCase.execute(document, selection);

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
