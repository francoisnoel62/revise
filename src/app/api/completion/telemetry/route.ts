// ABOUTME: Telemetry endpoint for autocomplete instrumentation (one record per suggestion)
// ABOUTME: Fire-and-forget; persists suggestion lifecycle and the post-insertion deletion patch

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/infrastructure/auth/auth-config';
import { getAutocompleteEventRepo, getRateLimitRepo } from '@/app/actions/utils';
import { AutocompleteEvent } from '@/domain/entities/AutocompleteEvent';
import {
  isValidAutocompleteOutcome,
  type AutocompleteOutcome,
} from '@/domain/value-objects/AutocompleteOutcome';
import { isValidAutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';

export const runtime = 'nodejs';

interface LifecyclePayload {
  type: 'lifecycle';
  suggestionId: string;
  projectId: string;
  chapterId?: string | null;
  triggeredAtIso: string;
  firstTokenMs: number | null;
  totalMs: number;
  lengthChars: number;
  lengthWords: number;
  acceptedChars?: number;
  acceptedWords?: number;
  intent?: string;
  providerType?: string | null;
  model?: string | null;
  canonFactsCount?: number | null;
  outcome: string;
}

interface DeletionPayload {
  type: 'deletion';
  suggestionId: string;
  deletedAfterMs: number;
}

type TelemetryPayload = LifecyclePayload | DeletionPayload;

const isNonNegativeNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

// Telemetry is intentionally high-frequency (one record per suggestion); cap the
// volume per user across a rolling window. Backed by a shared store so the limit
// holds across serverless instances, where an in-memory counter would be useless.
const TELEMETRY_WINDOW_MS = 60_000; // 1 minute
const TELEMETRY_MAX_PER_WINDOW = 300; // ~5 events/second sustained

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const ownerId = session.user.id;

  // Cap ingestion volume per user before doing any work — telemetry is
  // best-effort and must never become an abuse vector against storage. If the
  // limiter store is unavailable we fail OPEN: telemetry must never disrupt the
  // editor, and a store outage also blocks the persistence an attacker is after.
  try {
    const rateLimitRepo = await getRateLimitRepo();
    const quota = await rateLimitRepo.consumeFixedWindow(
      `telemetry:${ownerId}`,
      TELEMETRY_WINDOW_MS,
      TELEMETRY_MAX_PER_WINDOW
    );
    if (!quota.allowed) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: quota.retryAfterSeconds
          ? { 'Retry-After': String(quota.retryAfterSeconds) }
          : undefined,
      });
    }
  } catch (error) {
    console.error('[Autocomplete telemetry] rate-limit check failed:', error);
  }

  let body: TelemetryPayload;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  if (body.type === 'deletion') {
    if (!body.suggestionId || !isNonNegativeNumber(body.deletedAfterMs)) {
      return new Response('Invalid deletion payload', { status: 400 });
    }
    try {
      const repo = await getAutocompleteEventRepo();
      await repo.markDeletedAfterInsert(ownerId, body.suggestionId, body.deletedAfterMs);
    } catch (error) {
      // Telemetry must never disrupt the editor — swallow persistence errors.
      console.error('[Autocomplete telemetry] deletion error:', error);
    }
    return new Response(null, { status: 204 });
  }

  if (body.type === 'lifecycle') {
    const triggeredAt = new Date(body.triggeredAtIso);
    const validBase =
      !!body.suggestionId &&
      !!body.projectId &&
      isValidAutocompleteOutcome(body.outcome) &&
      isNonNegativeNumber(body.totalMs) &&
      isNonNegativeNumber(body.lengthChars) &&
      isNonNegativeNumber(body.lengthWords) &&
      (body.firstTokenMs === null || isNonNegativeNumber(body.firstTokenMs)) &&
      !Number.isNaN(triggeredAt.getTime());

    if (!validBase) {
      return new Response('Invalid lifecycle payload', { status: 400 });
    }

    try {
      const repo = await getAutocompleteEventRepo();
      const event = AutocompleteEvent.create({
        id: new ObjectId().toHexString(),
        ownerId,
        projectId: body.projectId,
        chapterId: body.chapterId ?? null,
        suggestionId: body.suggestionId,
        providerType: typeof body.providerType === 'string' ? body.providerType : null,
        model: typeof body.model === 'string' ? body.model : null,
        triggeredAt,
        firstTokenMs: body.outcome === 'empty' ? null : body.firstTokenMs,
        totalMs: body.totalMs,
        suggestionLengthChars: body.lengthChars,
        suggestionLengthWords: body.lengthWords,
        acceptedChars: isNonNegativeNumber(body.acceptedChars) ? body.acceptedChars : 0,
        acceptedWords: isNonNegativeNumber(body.acceptedWords) ? body.acceptedWords : 0,
        intent:
          body.intent && isValidAutocompleteIntent(body.intent) ? body.intent : null,
        outcome: body.outcome as AutocompleteOutcome,
        deletedAfterMs: null,
        canonFactsCount: isNonNegativeNumber(body.canonFactsCount)
          ? body.canonFactsCount
          : null,
      });
      await repo.save(event);
    } catch (error) {
      console.error('[Autocomplete telemetry] lifecycle error:', error);
    }
    return new Response(null, { status: 204 });
  }

  return new Response('Unknown telemetry type', { status: 400 });
}
