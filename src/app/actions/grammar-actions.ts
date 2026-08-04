// ABOUTME: Server Action checking one chapter's grammar with the local Grammalecte engine.
// ABOUTME: Authenticates the author and delegates every decision to the use case.

'use server';

import { CheckChapterGrammarUseCase } from '@/application/use-cases/CheckChapterGrammarUseCase';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import {
  getAuthenticatedUserId,
  getGrammarChecker,
  getProjectSettingsRepo,
  getRepository,
  withErrorHandling,
  type ActionResult,
} from './utils';

/**
 * Checks a chapter on demand and returns its grammar issues, positioned with
 * absolute ProseMirror positions. No AI provider and no tokens involved.
 */
export async function checkChapterGrammarAction(
  projectId: string,
  chapterId: string
): Promise<ActionResult<TextIssue[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CheckChapterGrammarUseCase(
      await getRepository(),
      await getProjectSettingsRepo(),
      await getGrammarChecker()
    );

    const { issues } = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      chapterId,
    });

    return issues;
  });
}
