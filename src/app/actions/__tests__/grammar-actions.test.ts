// ABOUTME: Unit tests for the chapter grammar-checking Server Action.
// ABOUTME: Verifies it authenticates, delegates to the use case, and reports failures.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TextIssue } from '@/domain/value-objects/TextIssue';

const execute = vi.fn();

vi.mock('@/application/use-cases/CheckChapterGrammarUseCase', () => ({
  CheckChapterGrammarUseCase: class {
    execute = execute;
  },
}));

vi.mock('../utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn().mockResolvedValue({}),
  getProjectSettingsRepo: vi.fn().mockResolvedValue({}),
  getGrammarChecker: vi.fn().mockResolvedValue({}),
  withErrorHandling: async (operation: () => Promise<unknown>) => {
    try {
      return { success: true, data: await operation() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));

const { getAuthenticatedUserId } = await import('../utils');
const { checkChapterGrammarAction } = await import('../grammar-actions');

const issue: TextIssue = {
  nature: 'grammar',
  from: 24,
  to: 29,
  text: 'chien',
  message: 'Accord de nombre erroné.',
  suggestions: ['chiens'],
  ruleFamily: 'gn',
};

describe('checkChapterGrammarAction', () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'owner-1' });
    execute.mockReset();
  });

  it('returns the chapter issues for the authenticated owner', async () => {
    execute.mockResolvedValue({ issues: [issue] });

    const result = await checkChapterGrammarAction('project-1', 'chapter-1');

    expect(result).toEqual({ success: true, data: [issue] });
    expect(execute).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
    });
  });

  it('refuses an unauthenticated request without running the use case', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Please sign in to continue', redirect: '/auth/signin' },
    });

    const result = await checkChapterGrammarAction('project-1', 'chapter-1');

    expect(result).toEqual({
      success: false,
      error: 'Please sign in to continue',
      redirect: '/auth/signin',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('reports a use-case failure as an error result', async () => {
    execute.mockRejectedValue(new Error('Chapter not found'));

    const result = await checkChapterGrammarAction('project-1', 'chapter-1');

    expect(result).toEqual({ success: false, error: 'Chapter not found' });
  });
});
