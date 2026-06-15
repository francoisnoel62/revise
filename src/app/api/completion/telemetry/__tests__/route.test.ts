// ABOUTME: Tests for the autocomplete telemetry endpoint
// ABOUTME: Verifies auth guard, validation, and persistence dispatch (lifecycle + deletion)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/app/actions/utils', () => ({
  getAutocompleteEventRepo: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import { getAutocompleteEventRepo } from '@/app/actions/utils';
import { POST } from '../route';

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/completion/telemetry', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const lifecycleBody = (overrides: Record<string, unknown> = {}) => ({
  type: 'lifecycle',
  suggestionId: 'sugg-1',
  projectId: 'proj-1',
  chapterId: 'chap-1',
  triggeredAtIso: new Date('2026-06-14T21:00:00Z').toISOString(),
  firstTokenMs: 220,
  totalMs: 900,
  lengthChars: 42,
  lengthWords: 8,
  acceptedChars: 42,
  acceptedWords: 8,
  providerType: 'anthropic',
  model: 'claude-sonnet-4-5',
  outcome: 'accepted_full',
  ...overrides,
});

describe('POST /api/completion/telemetry', () => {
  let repo: { save: ReturnType<typeof vi.fn>; markDeletedAfterInsert: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    repo = { save: vi.fn().mockResolvedValue(undefined), markDeletedAfterInsert: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(getAutocompleteEventRepo).mockResolvedValue(repo as never);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest(lifecycleBody()));
    expect(res.status).toBe(401);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('persists a lifecycle event and returns 204', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const res = await POST(makeRequest(lifecycleBody()));

    expect(res.status).toBe(204);
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.getOwnerId()).toBe('user-1');
    expect(saved.getSuggestionId()).toBe('sugg-1');
    expect(saved.getOutcome()).toBe('accepted_full');
    expect(saved.getFirstTokenMs()).toBe(220);
    expect(saved.getAcceptedChars()).toBe(42);
    expect(saved.getProviderType()).toBe('anthropic');
    expect(saved.getModel()).toBe('claude-sonnet-4-5');
  });

  it('forces firstTokenMs to null for an empty outcome', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const res = await POST(
      makeRequest(lifecycleBody({ outcome: 'empty', firstTokenMs: null, lengthChars: 0, lengthWords: 0 }))
    );

    expect(res.status).toBe(204);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.getOutcome()).toBe('empty');
    expect(saved.getFirstTokenMs()).toBeNull();
  });

  it('rejects an invalid outcome with 400', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    const res = await POST(makeRequest(lifecycleBody({ outcome: 'nope' })));
    expect(res.status).toBe(400);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('patches a deletion and returns 204', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const res = await POST(
      makeRequest({ type: 'deletion', suggestionId: 'sugg-1', deletedAfterMs: 5000 })
    );

    expect(res.status).toBe(204);
    expect(repo.markDeletedAfterInsert).toHaveBeenCalledWith('user-1', 'sugg-1', 5000);
  });

  it('rejects an unknown telemetry type with 400', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    const res = await POST(makeRequest({ type: 'bogus' }));
    expect(res.status).toBe(400);
  });
});
