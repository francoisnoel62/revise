// ABOUTME: Tests for usage server actions
// ABOUTME: Covers autocomplete stats action authentication and repository delegation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectAutocompleteStatsAction } from '../usage-actions';

vi.mock('../utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getAutocompleteEventRepo: vi.fn(),
  getAIUsageRepo: vi.fn(),
  withErrorHandling: async <T>(operation: () => Promise<T>) => {
    try {
      return { success: true, data: await operation() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  },
}));

import { getAuthenticatedUserId, getAutocompleteEventRepo } from '../utils';

describe('getProjectAutocompleteStatsAction', () => {
  const stats = {
    total: 1,
    byOutcome: {
      accepted_full: 1,
      accepted_partial: 0,
      rejected_escape: 0,
      superseded_typing: 0,
      empty: 0,
    },
    acceptanceRate: 1,
    partialAcceptanceRate: 0,
    postInsertionDeletionRate: 0,
    firstTokenMsP50: 120,
    firstTokenMsP95: 120,
    totalMsP50: 600,
  };

  const repo = {
    getStatsByProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAutocompleteEventRepo).mockResolvedValue(repo as never);
  });

  it('returns autocomplete stats for the authenticated owner', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    repo.getStatsByProject.mockResolvedValue(stats);

    const result = await getProjectAutocompleteStatsAction('project-1');

    expect(result.success).toBe(true);
    expect(repo.getStatsByProject).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      undefined
    );
    if (result.success) {
      expect(result.data).toBe(stats);
    }
  });

  it('passes optional date filters to the repository', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    repo.getStatsByProject.mockResolvedValue(stats);
    const options = {
      startDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2026-06-15T00:00:00Z'),
    };

    await getProjectAutocompleteStatsAction('project-1', options);

    expect(repo.getStatsByProject).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      options
    );
  });

  it('returns auth error without querying the repository', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await getProjectAutocompleteStatsAction('project-1');

    expect(result.success).toBe(false);
    expect(repo.getStatsByProject).not.toHaveBeenCalled();
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });
});
