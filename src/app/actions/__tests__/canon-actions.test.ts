// ABOUTME: Tests for canon-actions ownership guards
// ABOUTME: Writing a fact requires the target project to belong to the authenticated user

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils');
  return {
    ...actual,
    getAuthenticatedUserId: vi.fn(),
    getRepository: vi.fn(),
    getCanonFactRepo: vi.fn(),
    getIdGenerator: vi.fn(),
    getRateLimitRepo: vi.fn(),
    getTrackedLLMProviderById: vi.fn(),
  };
});

import {
  getAuthenticatedUserId,
  getRepository,
  getCanonFactRepo,
  getIdGenerator,
  getRateLimitRepo,
  getTrackedLLMProviderById,
} from '../utils';
import {
  createCanonFactAction,
  generateCanonFactsAction,
} from '../canon-actions';

describe('createCanonFactAction — ownership guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    vi.mocked(getIdGenerator).mockResolvedValue({
      generate: () => 'fact-1',
    } as never);
  });

  it('refuses to write when the project does not belong to the user', async () => {
    const save = vi.fn();
    vi.mocked(getRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue(null), // not owned / not found
    } as never);
    vi.mocked(getCanonFactRepo).mockResolvedValue({ save } as never);

    const result = await createCanonFactAction('foreign-project', {
      entity: 'Léa',
      statement: 'est morte',
      validFromChapter: 0,
      validToChapter: null,
    });

    expect(result.success).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it('writes the fact when the project belongs to the user', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue({ getId: () => 'project-1' }),
    } as never);
    vi.mocked(getCanonFactRepo).mockResolvedValue({ save } as never);

    const result = await createCanonFactAction('project-1', {
      entity: 'Léa',
      statement: 'est morte',
      validFromChapter: 0,
      validToChapter: null,
    });

    expect(result.success).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('generateCanonFactsAction — rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
  });

  it('blocks generation and skips the LLM when the per-project quota is exceeded', async () => {
    vi.mocked(getRateLimitRepo).mockResolvedValue({
      consumeFixedWindow: vi
        .fn()
        .mockResolvedValue({ allowed: false, retryAfterSeconds: 17 }),
    } as never);

    const result = await generateCanonFactsAction('project-1', 'provider-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('17');
    }
    // The expensive LLM provider must never be constructed when blocked.
    expect(getTrackedLLMProviderById).not.toHaveBeenCalled();
  });

  it('scopes the quota key per user and project', async () => {
    const consumeFixedWindow = vi
      .fn()
      .mockResolvedValue({ allowed: false, retryAfterSeconds: 5 });
    vi.mocked(getRateLimitRepo).mockResolvedValue({ consumeFixedWindow } as never);

    await generateCanonFactsAction('project-42', 'provider-1');

    expect(consumeFixedWindow).toHaveBeenCalledWith(
      'canon-facts:user-1:project-42',
      expect.any(Number),
      expect.any(Number)
    );
  });
});
