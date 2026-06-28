// ABOUTME: Tests for presentation-override-actions — auth guard and delegation to repository.
// ABOUTME: Verifies multi-tenant isolation: ownerId is always threaded through.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils');
  return {
    ...actual,
    getAuthenticatedUserId: vi.fn(),
    getPresentationOverrideRepo: vi.fn(),
  };
});

import { getAuthenticatedUserId, getPresentationOverrideRepo } from '../utils';
import {
  savePresentationOverridesAction,
  loadPresentationOverridesAction,
  deletePresentationOverridesAction,
} from '../presentation-override-actions';

const CHAPTER_ID = 'chapter-abc';
const OWNER_ID = 'user-xyz';

function makeMockRepo() {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('savePresentationOverridesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: OWNER_ID });
  });

  it('returns error when user is not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Please sign in to continue', redirect: '/auth/signin' },
    });

    const result = await savePresentationOverridesAction(CHAPTER_ID, []);
    expect(result.success).toBe(false);
  });

  it('calls repo.save with chapterId, ownerId, and overrides', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    const overrides = [{ nodeIndex: 0, props: { fontFamily: 'Georgia' } }];
    await savePresentationOverridesAction(CHAPTER_ID, overrides);

    expect(repo.save).toHaveBeenCalledWith(CHAPTER_ID, OWNER_ID, overrides);
  });

  it('passes ownerId from the authenticated session — never from the caller', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    await savePresentationOverridesAction(CHAPTER_ID, []);

    const [, calledOwnerId] = repo.save.mock.calls[0];
    expect(calledOwnerId).toBe(OWNER_ID);
  });

  it('returns success when save succeeds', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    const result = await savePresentationOverridesAction(CHAPTER_ID, []);
    expect(result.success).toBe(true);
  });
});

describe('loadPresentationOverridesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: OWNER_ID });
  });

  it('returns error when user is not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Please sign in to continue', redirect: '/auth/signin' },
    });

    const result = await loadPresentationOverridesAction(CHAPTER_ID);
    expect(result.success).toBe(false);
  });

  it('calls repo.load with chapterId and ownerId', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    await loadPresentationOverridesAction(CHAPTER_ID);

    expect(repo.load).toHaveBeenCalledWith(CHAPTER_ID, OWNER_ID);
  });

  it('returns null when no overrides exist', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    const result = await loadPresentationOverridesAction(CHAPTER_ID);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it('returns the override layer when overrides exist', async () => {
    const repo = makeMockRepo();
    const storedOverrides = [{ nodeIndex: 2, props: { fontSize: '14pt', textAlign: 'left' } }];
    repo.load.mockResolvedValue(storedOverrides);
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    const result = await loadPresentationOverridesAction(CHAPTER_ID);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(storedOverrides);
  });
});

describe('deletePresentationOverridesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: OWNER_ID });
  });

  it('returns error when user is not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Please sign in to continue', redirect: '/auth/signin' },
    });

    const result = await deletePresentationOverridesAction(CHAPTER_ID);
    expect(result.success).toBe(false);
  });

  it('calls repo.delete with chapterId and ownerId', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    await deletePresentationOverridesAction(CHAPTER_ID);

    expect(repo.delete).toHaveBeenCalledWith(CHAPTER_ID, OWNER_ID);
  });

  it('returns success when delete succeeds', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    const result = await deletePresentationOverridesAction(CHAPTER_ID);
    expect(result.success).toBe(true);
  });

  it('does not call save or load — only delete', async () => {
    const repo = makeMockRepo();
    vi.mocked(getPresentationOverrideRepo).mockResolvedValue(repo as never);

    await deletePresentationOverridesAction(CHAPTER_ID);

    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.load).not.toHaveBeenCalled();
    expect(repo.delete).toHaveBeenCalledTimes(1);
  });
});
