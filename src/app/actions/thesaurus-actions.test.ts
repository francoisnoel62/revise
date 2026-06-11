// ABOUTME: Tests for thesaurus server actions — lexical and AI paths
// ABOUTME: Mocks utils and infrastructure; verifies auth guards, input validation, and happy paths

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLexicalAlternativesAction,
  getAIAlternativesAction,
} from './thesaurus-actions';

// ── Mock './utils' ────────────────────────────────────────────────────────────

vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getMetadataRepo: vi.fn(),
  getTrackedLLMProviderForProject: vi.fn(),
  withErrorHandling: vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),
}));

// ── Mock infrastructure ────────────────────────────────────────────────────────

vi.mock('@/infrastructure/config/database', () => ({
  getDatabase: vi.fn().mockResolvedValue({}),
}));

const mockLookup = vi.fn().mockResolvedValue(['observer', 'scruter', 'épier']);

vi.mock('@/infrastructure/lexical', () => {
  return {
    JeuxDeMotsThesaurus: class {
      lookup = mockLookup;
    },
  };
});

const mockExecute = vi.fn().mockResolvedValue({
  layer1: ['observer', 'scruter'],
  layer2: [{ word: 'épier', sceneEffect: 'installe une menace', register: 'courant' }],
  voiceAnchored: true,
});

vi.mock('@/application/use-cases/SuggestAlternativesUseCase', () => {
  return {
    SuggestAlternativesUseCase: class {
      execute = mockExecute;
    },
  };
});

vi.mock('@/application/services/AIContextBuilder', () => {
  return {
    AIContextBuilder: class {},
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

import { getAuthenticatedUserId, getMetadataRepo, getTrackedLLMProviderForProject } from './utils';

const mockAuth = () =>
  vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });

const mockAuthFail = () =>
  vi.mocked(getAuthenticatedUserId).mockResolvedValue({
    error: { success: false, error: 'Please sign in to continue', redirect: '/auth/signin' },
  });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getLexicalAlternativesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth();
    vi.mocked(getMetadataRepo).mockResolvedValue({} as never);
    vi.mocked(getTrackedLLMProviderForProject).mockResolvedValue({} as never);
  });

  it('returns layer1 synonyms for a valid word', async () => {
    const result = await getLexicalAlternativesAction('proj-1', 'regarder');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layer1).toEqual(['observer', 'scruter', 'épier']);
    }
  });

  it('returns auth error when not authenticated', async () => {
    mockAuthFail();

    const result = await getLexicalAlternativesAction('proj-1', 'regarder');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.redirect).toBe('/auth/signin');
  });

  it('returns error when projectId is empty', async () => {
    const result = await getLexicalAlternativesAction('', 'regarder');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Project ID');
  });

  it('returns error when word is empty', async () => {
    const result = await getLexicalAlternativesAction('proj-1', '');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Word');
  });

  it('does NOT call getTrackedLLMProviderForProject', async () => {
    await getLexicalAlternativesAction('proj-1', 'regarder');

    expect(getTrackedLLMProviderForProject).not.toHaveBeenCalled();
  });
});

describe('getAIAlternativesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth();
    vi.mocked(getMetadataRepo).mockResolvedValue({} as never);
    vi.mocked(getTrackedLLMProviderForProject).mockResolvedValue({} as never);
  });

  it('returns both layers for valid inputs', async () => {
    const result = await getAIAlternativesAction(
      'proj-1',
      'regarder',
      'Elle le regardait depuis la fenêtre.'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layer1).toEqual(['observer', 'scruter']);
      expect(result.data.layer2).toHaveLength(1);
      expect(result.data.layer2[0].word).toBe('épier');
      expect(result.data.layer2[0].sceneEffect).toBe('installe une menace');
      expect(result.data.voiceAnchored).toBe(true);
    }
  });

  it('returns auth error when not authenticated', async () => {
    mockAuthFail();

    const result = await getAIAlternativesAction('proj-1', 'regarder', 'phrase.');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.redirect).toBe('/auth/signin');
  });

  it('returns error when projectId is empty', async () => {
    const result = await getAIAlternativesAction('', 'regarder', 'phrase.');

    expect(result.success).toBe(false);
  });

  it('returns error when word is empty', async () => {
    const result = await getAIAlternativesAction('proj-1', '', 'phrase.');

    expect(result.success).toBe(false);
  });

  it('returns error when sentence is empty', async () => {
    const result = await getAIAlternativesAction('proj-1', 'regarder', '');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Sentence');
  });

  it('serializes WordAlternative domain objects to plain DTOs', async () => {
    const result = await getAIAlternativesAction('proj-1', 'regarder', 'phrase.');

    if (result.success) {
      const alt = result.data.layer2[0];
      // Plain object — no class methods
      expect(typeof alt.word).toBe('string');
      expect(typeof alt.sceneEffect).toBe('string');
    }
  });

  it('calls getTrackedLLMProviderForProject with userId and projectId', async () => {
    await getAIAlternativesAction('proj-1', 'regarder', 'phrase.');

    expect(getTrackedLLMProviderForProject).toHaveBeenCalledWith('user-1', 'proj-1');
  });
});
