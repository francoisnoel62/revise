// ABOUTME: Streaming API route for text autocompletion
// ABOUTME: Uses Server-Sent Events (SSE) to stream AI-generated text

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getCharacterRepository,
  getCanonFactRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderById, getRateLimitRepo } from '@/app/actions/utils';
import { AutocompleteContextBuilder } from '@/application/services/AutocompleteContextBuilder';
import { intentDirective } from '@/application/services/autocompleteIntents';
import {
  lengthDirective,
  audaceDirective,
} from '@/application/services/autocompletePreferenceDirectives';
import { detectEntities } from '@/application/services/canonEntities';
import { isValidAutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';
import {
  isValidSuggestionLength,
  isValidAudaceLevel,
} from '@/domain/value-objects/AutocompletePreferences';

export const runtime = 'nodejs';

interface CompletionRequest {
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
  chapterId?: string;
  intent?: string;
  suggestionLength?: string;
  audace?: string;
  isPrefetch?: boolean;
}

// Each completion is a billed LLM call; smart prefetch can fire one on every
// idle pause, so cap per-user volume across a rolling window. Backed by a shared
// store so the limit holds across serverless instances. Prefetch (speculative,
// background) gets its OWN smaller bucket so a chatty prefetch can never starve
// the budget for the completions the author actually asked for with Tab.
const COMPLETION_WINDOW_MS = 60_000; // 1 minute
const COMPLETION_MAX_PER_WINDOW = 60; // ~1 manual completion/second sustained
const PREFETCH_MAX_PER_WINDOW = 20; // speculative; capped well below manual

// The client sends a bounded cursor window (~3000/400 chars); reject anything
// far beyond that before doing any work, so a malformed or hostile client
// cannot inflate the prompt — and the bill — at will.
const MAX_BEFORE_CHARS = 8000;
const MAX_AFTER_CHARS = 2000;

export async function POST(request: NextRequest) {
  // 1. Authenticate using Auth.js
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // 2. Parse request body
  let body: CompletionRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { projectId, textBeforeCursor, textAfterCursor, chapterId } = body;
  const intent =
    body.intent && isValidAutocompleteIntent(body.intent) ? body.intent : 'natural';
  const suggestionLength = isValidSuggestionLength(body.suggestionLength)
    ? body.suggestionLength
    : undefined;
  const audace = isValidAudaceLevel(body.audace) ? body.audace : undefined;
  const isPrefetch = body.isPrefetch === true;

  if (!projectId || !textBeforeCursor) {
    return new Response('Missing required fields', { status: 400 });
  }

  if (
    textBeforeCursor.length > MAX_BEFORE_CHARS ||
    (textAfterCursor?.length ?? 0) > MAX_AFTER_CHARS
  ) {
    return new Response('Payload too large', { status: 413 });
  }

  // 3. Cap per-user volume before any billed work. Prefetch and manual draw from
  // separate buckets so speculative calls can't exhaust the manual budget. Fail
  // OPEN on a store outage: completion must never break mid-sentence.
  try {
    const rateLimitRepo = await getRateLimitRepo();
    const quota = await rateLimitRepo.consumeFixedWindow(
      isPrefetch ? `prefetch:${userId}` : `completion:${userId}`,
      COMPLETION_WINDOW_MS,
      isPrefetch ? PREFETCH_MAX_PER_WINDOW : COMPLETION_MAX_PER_WINDOW
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
    console.error('[Autocomplete] rate-limit check failed:', error);
  }

  // 4. Get LLM provider via composition root
  const providerRepo = await getProviderRepository();
  const { getProjectRepository } = await import('@/infrastructure/config/providers');
  const projectRepo = await getProjectRepository();

  // Get project to find its selected provider
  const project = await projectRepo.loadProject(userId, projectId);
  const projectProviderId = project?.getProviderId();

  // Get providers and find the one assigned to this project
  const providers = await providerRepo.listProviders(userId);
  let selectedProvider = projectProviderId
    ? providers.find((p) => p.getId() === projectProviderId)
    : null;

  // Fallback to first provider if project has no provider set
  if (!selectedProvider) {
    selectedProvider = providers[0];
  }

  let llmProvider;

  if (selectedProvider) {
    // Tracked provider so autocompletion usage and exchange content are recorded.
    llmProvider = await getTrackedLLMProviderById(userId, selectedProvider.getId(), projectId);
  } else {
    return new Response('No AI provider configured', { status: 400 });
  }

  const selectedProviderType = selectedProvider.getType();
  const selectedProviderModel = selectedProvider.getModel();

  // 5. Build the long-range completion context (previous chapters + canon facts).
  // The local scene is already carried by the cursor window (textBeforeCursor).
  const canonFactRepo = await getCanonFactRepository();
  const autocompleteContext = new AutocompleteContextBuilder(canonFactRepo);

  // Resolve which known characters appear in the local window and the current
  // chapter index for temporal canon fact selection.
  let entities: string[] | undefined;
  let chapterIndex: number | undefined;
  let previousChapters: import('@/domain/entities/Chapter').Chapter[] = [];
  if (chapterId && project) {
    const chapters = project.getChapters();
    const idx = chapters.findIndex((c) => c.getId() === chapterId);
    if (idx >= 0) {
      chapterIndex = idx;
      previousChapters = chapters.slice(0, idx);
      const characterRepo = await getCharacterRepository();
      const characters = await characterRepo.findByProjectId(userId, projectId);
      entities = detectEntities(textBeforeCursor, characters.map((c) => c.getName()));
    }
  }

  const { context: baseContext, canonFactsCount } =
    await autocompleteContext.buildContext({
      ownerId: userId,
      projectId,
      includeManuscript: true,
      chapters: previousChapters,
      includeCanon: true,
      entities,
      chapterIndex,
    });
  // Prepend the (optional) intent + preference directives so they sit near the
  // top of the context (author intent, requested length, requested audace).
  const projectContext =
    intentDirective(intent) +
    lengthDirective(suggestionLength) +
    audaceDirective(audace) +
    baseContext;

  // 6. Create streaming response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'metadata',
              providerType: selectedProviderType,
              model: selectedProviderModel,
              canonFactsCount,
            })}\n\n`
          )
        );

        const generator = llmProvider.generateCompletionStream(
          textBeforeCursor,
          textAfterCursor,
          projectContext
        );

        const streamStart = performance.now();
        let firstTokenMs: number | undefined;
        for await (const chunk of generator) {
          if (firstTokenMs === undefined) {
            firstTokenMs = Math.round(performance.now() - streamStart);
          }
          // Send as Server-Sent Event
          const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send done event with latency telemetry
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', firstTokenMs })}\n\n`));
        controller.close();
      } catch (error) {
        // Log the full detail server-side; never forward provider/internal error
        // text to the client (it can leak keys, models, or stack details).
        console.error('[Autocomplete] Stream error:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'Erreur lors de la génération.' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
