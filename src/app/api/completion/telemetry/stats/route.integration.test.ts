// ABOUTME: Integration tests for autocomplete telemetry stats API with real Mongo persistence
// ABOUTME: Mocks only authentication; verifies aggregation and owner isolation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { getDatabase } from '@/infrastructure/config/database';

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import { GET } from './route';

const COLLECTION = 'autocompleteEvents';

function request(projectId?: string) {
  const url = new URL('http://localhost/api/completion/telemetry/stats');
  if (projectId) url.searchParams.set('projectId', projectId);
  return new NextRequest(url);
}

function doc(
  ownerId: string,
  projectId: string,
  outcome: string,
  overrides: Record<string, unknown> = {}
) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    ownerId,
    projectId,
    chapterId: 'chapter-1',
    suggestionId: randomUUID(),
    providerType: null,
    model: null,
    triggeredAt: now,
    firstTokenMs: outcome === 'empty' ? null : 200,
    totalMs: 800,
    suggestionLengthChars: outcome === 'empty' ? 0 : 30,
    suggestionLengthWords: outcome === 'empty' ? 0 : 6,
    acceptedChars: outcome === 'accepted_full' ? 30 : 0,
    acceptedWords: outcome === 'accepted_full' ? 6 : 0,
    intent: 'natural',
    outcome,
    deletedAfterMs: null,
    createdAt: now,
    ...overrides,
  };
}

describe('GET /api/completion/telemetry/stats — integration MongoDB', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `stats-owner-${randomUUID()}`;
    projectId = `stats-project-${randomUUID()}`;
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: ownerId } } as never);
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({
      ownerId: { $regex: /^stats-(owner|other)-/ },
    });
  });

  it('returns aggregated stats for the authenticated owner and project', async () => {
    await db.collection(COLLECTION).insertMany([
      doc(ownerId, projectId, 'accepted_full', { firstTokenMs: 100, deletedAfterMs: 3000 }),
      doc(ownerId, projectId, 'accepted_full', { firstTokenMs: 200 }),
      doc(ownerId, projectId, 'accepted_partial', { firstTokenMs: 300 }),
      doc(ownerId, projectId, 'rejected_escape', { firstTokenMs: 400 }),
      doc(ownerId, projectId, 'empty'),
    ]);

    const response = await GET(request(projectId));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(5);
    expect(body.byOutcome.accepted_full).toBe(2);
    expect(body.byOutcome.accepted_partial).toBe(1);
    expect(body.byOutcome.empty).toBe(1);
    expect(body.acceptanceRate).toBeCloseTo(2 / 5);
    expect(body.partialAcceptanceRate).toBeCloseTo(1 / 5);
    expect(body.postInsertionDeletionRate).toBeCloseTo(1 / 2);
    expect(body.firstTokenMsP50).toBeCloseTo(250);
  });

  it('does not include another owner events', async () => {
    const otherOwner = `stats-other-${randomUUID()}`;
    await db.collection(COLLECTION).insertMany([
      doc(ownerId, projectId, 'accepted_full'),
      doc(otherOwner, projectId, 'accepted_full'),
    ]);

    const response = await GET(request(projectId));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
  });

  it('requires authentication and projectId', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const unauthenticated = await GET(request(projectId));
    expect(unauthenticated.status).toBe(401);

    vi.mocked(auth).mockResolvedValue({ user: { id: ownerId } } as never);
    const missingProject = await GET(request());
    expect(missingProject.status).toBe(400);
  });
});
