// ABOUTME: Integration tests for autocomplete telemetry route with real Mongo persistence
// ABOUTME: Mocks only authentication; exercises route validation, repository wiring and storage

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDatabase } from '@/infrastructure/config/database';
import type { Db } from 'mongodb';

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import { POST } from './route';

const COLLECTION = 'autocompleteEvents';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/completion/telemetry', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function lifecyclePayload(ownerSuffix: string, overrides: Record<string, unknown> = {}) {
  return {
    type: 'lifecycle',
    suggestionId: `suggestion-${ownerSuffix}`,
    projectId: `project-${ownerSuffix}`,
    chapterId: `chapter-${ownerSuffix}`,
    triggeredAtIso: new Date('2026-06-14T21:00:00Z').toISOString(),
    firstTokenMs: 180,
    totalMs: 740,
    lengthChars: 34,
    lengthWords: 6,
    acceptedChars: 34,
    acceptedWords: 6,
    intent: 'natural',
    outcome: 'accepted_full',
    ...overrides,
  };
}

describe('POST /api/completion/telemetry — integration MongoDB', () => {
  let db: Db;
  let ownerId: string;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `telemetry-route-${randomUUID()}`;
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: ownerId } } as never);
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
  });

  it('persists a lifecycle event through the real repository wiring', async () => {
    const payload = lifecyclePayload(ownerId);

    const response = await POST(makeRequest(payload));

    expect(response.status).toBe(204);

    const stored = await db.collection(COLLECTION).findOne({
      ownerId,
      suggestionId: payload.suggestionId,
    });

    expect(stored).toMatchObject({
      ownerId,
      projectId: payload.projectId,
      chapterId: payload.chapterId,
      suggestionId: payload.suggestionId,
      firstTokenMs: 180,
      totalMs: 740,
      suggestionLengthChars: 34,
      suggestionLengthWords: 6,
      acceptedChars: 34,
      acceptedWords: 6,
      intent: 'natural',
      outcome: 'accepted_full',
      deletedAfterMs: null,
    });
    expect(stored?.createdAt).toBeInstanceOf(Date);
  });

  it('patches deletedAfterMs for the authenticated owner only', async () => {
    const payload = lifecyclePayload(ownerId, { suggestionId: `shared-${randomUUID()}` });
    await POST(makeRequest(payload));

    const otherOwnerId = `other-${randomUUID()}`;
    await db.collection(COLLECTION).insertOne({
      ownerId: otherOwnerId,
      projectId: payload.projectId,
      chapterId: payload.chapterId,
      suggestionId: payload.suggestionId,
      providerType: null,
      model: null,
      triggeredAt: new Date(),
      firstTokenMs: 100,
      totalMs: 200,
      suggestionLengthChars: 10,
      suggestionLengthWords: 2,
      acceptedChars: 10,
      acceptedWords: 2,
      intent: 'natural',
      outcome: 'accepted_full',
      deletedAfterMs: null,
      createdAt: new Date(),
    });

    const response = await POST(
      makeRequest({
        type: 'deletion',
        suggestionId: payload.suggestionId,
        deletedAfterMs: 4200,
      })
    );

    expect(response.status).toBe(204);

    const ownStored = await db.collection(COLLECTION).findOne({
      ownerId,
      suggestionId: payload.suggestionId,
    });
    const otherStored = await db.collection(COLLECTION).findOne({
      ownerId: otherOwnerId,
      suggestionId: payload.suggestionId,
    });

    expect(ownStored?.deletedAfterMs).toBe(4200);
    expect(otherStored?.deletedAfterMs).toBeNull();

    await db.collection(COLLECTION).deleteMany({ ownerId: otherOwnerId });
  });

  it('rejects invalid lifecycle payloads before persistence', async () => {
    const response = await POST(
      makeRequest(lifecyclePayload(ownerId, { outcome: 'invalid-outcome' }))
    );

    expect(response.status).toBe(400);

    const count = await db.collection(COLLECTION).countDocuments({ ownerId });
    expect(count).toBe(0);
  });
});
