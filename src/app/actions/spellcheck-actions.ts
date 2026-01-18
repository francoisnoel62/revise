// ABOUTME: Server Action for checking spelling and grammar using AI.
// ABOUTME: Requires user-configured provider (no default fallback).

'use server';

import { CheckSpellingAndGrammarUseCase } from '@/application/use-cases/CheckSpellingAndGrammarUseCase';
import { extractTextFromTipTapJSON } from '@/infrastructure/document/utils/tiptap-conversion';
import {
  ActionResult,
  getAuthenticatedUserId,
  getLLMProviderForProject,
  withErrorHandling,
} from './utils';

interface SpellCheckCorrectionDTO {
  original: string;
  corrected: string;
  type: 'spelling' | 'grammar' | 'style' | 'punctuation';
  explanation: string;
  typeLabel: string;
}

interface SpellCheckResultDTO {
  corrections: SpellCheckCorrectionDTO[];
  correctedText: string;
  hasErrors: boolean;
  summary: string;
}

/**
 * Check spelling and grammar in the provided text using AI.
 *
 * Requires a user-configured provider for the project.
 * Throws an error if no provider is configured.
 *
 * @param projectId The project ID (to determine which provider to use)
 * @param content Content to check (TipTap JSON string or plain text)
 * @param language Optional language hint (e.g., 'fr', 'en')
 * @returns Action result with spell check results or error
 */
export async function checkSpellingAndGrammar(
  projectId: string,
  content: string,
  language?: string
): Promise<ActionResult<SpellCheckResultDTO>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate input
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Content is required' };
  }

  return withErrorHandling(async () => {
    const startTime = performance.now();

    // 3. Get LLM provider for project
    const llmProvider = await getLLMProviderForProject(userId, projectId);

    // 4. Extract plain text from TipTap JSON if needed
    let textToCheck = content;
    try {
      const tiptapJson = JSON.parse(content);
      textToCheck = extractTextFromTipTapJSON(tiptapJson);
    } catch {
      // If parsing fails, use content as-is (plain text)
      textToCheck = content;
    }

    // 5. Execute spell check use case
    const useCase = new CheckSpellingAndGrammarUseCase(llmProvider);
    const result = await useCase.execute(textToCheck, language);

    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SpellCheck] Completed in ${duration.toFixed(2)}ms`);
      console.log(`[SpellCheck] Found ${result.corrections.length} corrections`);
    }

    // 6. Convert to DTOs
    return {
      corrections: result.corrections.map((c) => ({
        original: c.original,
        corrected: c.corrected,
        type: c.type,
        explanation: c.explanation,
        typeLabel: c.getTypeLabel(),
      })),
      correctedText: result.correctedText,
      hasErrors: result.hasErrors,
      summary: result.summary,
    };
  });
}
