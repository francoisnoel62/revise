// ABOUTME: Server Action checking one chapter's grammar with the local Grammalecte engine.
// ABOUTME: Authenticates the author and delegates every decision to the use case.

'use server';

import { CheckChapterGrammarUseCase } from '@/application/use-cases/CheckChapterGrammarUseCase';
import {
  DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
  isPunctuationChecked,
  withPunctuationChecked,
} from '@/domain/value-objects/GrammarRuleProfile';
import type { IgnoredGrammarIssue } from '@/domain/value-objects/IgnoredGrammarIssue';
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

/**
 * Records that the author declined a remark. The rule keeps working elsewhere;
 * only this wording, under this rule, stops being raised in this project.
 */
export async function ignoreGrammarIssueAction(
  projectId: string,
  issue: IgnoredGrammarIssue
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getProjectSettingsRepo();
    const settings = await repo.findByProjectId(auth.userId, projectId);
    if (!settings) throw new Error('Project settings not found');

    const updated = settings.addIgnoredGrammarIssue(issue);
    if (updated !== settings) await repo.update(auth.userId, updated);
  });
}

/** Whether this project's corrector reports on punctuation. */
export async function getPunctuationCheckingAction(
  projectId: string
): Promise<boolean> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return true;

  const repo = await getProjectSettingsRepo();
  const settings = await repo.findByProjectId(auth.userId, projectId);
  return isPunctuationChecked(
    settings?.getGrammarRuleProfile() ?? DEFAULT_FICTION_GRAMMAR_RULE_PROFILE
  );
}

export async function setPunctuationCheckingAction(
  projectId: string,
  checked: boolean
): Promise<ActionResult<boolean>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getProjectSettingsRepo();
    const settings = await repo.findByProjectId(auth.userId, projectId);
    if (!settings) throw new Error('Project settings not found');

    const updated = settings.updateGrammarRuleProfile(
      withPunctuationChecked(settings.getGrammarRuleProfile(), checked)
    );
    await repo.update(auth.userId, updated);

    return isPunctuationChecked(updated.getGrammarRuleProfile());
  });
}
