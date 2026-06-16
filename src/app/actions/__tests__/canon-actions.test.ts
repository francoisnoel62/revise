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
  };
});

import {
  getAuthenticatedUserId,
  getRepository,
  getCanonFactRepo,
  getIdGenerator,
} from '../utils';
import { createCanonFactAction } from '../canon-actions';

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
