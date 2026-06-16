// ABOUTME: Streaming API route for text autocompletion
// ABOUTME: Uses Server-Sent Events (SSE) to stream AI-generated text

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getMetadataRepository,
  getResearchDocumentRepository,
  getCharacterRepository,
  getCanonFactRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderById } from '@/app/actions/utils';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { AutocompleteContextBuilder } from '@/application/services/AutocompleteContextBuilder';
import { intentDirective } from '@/application/services/autocompleteIntents';
import { detectEntities } from '@/application/services/canonEntities';
import { isValidAutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';
import { CANON_CONTEXT_ENABLED } from '@/lib/ai-feature-flags';

export const runtime = 'nodejs';

interface CompletionRequest {
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
  chapterId?: string;
  intent?: string;
}

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

  if (!projectId || !textBeforeCursor) {
    return new Response('Missing required fields', { status: 400 });
  }

  // 3. Get LLM provider via composition root
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

  // 4. Build the long-range completion context (author intent + optional canon).
  // The local scene is already carried by the cursor window (textBeforeCursor); derived
  // metadata is kept OUT of the writing hot path (opt-in only).
  const metadataRepo = await getMetadataRepository();
  const researchRepo = await getResearchDocumentRepository();
  const aiContextBuilder = new AIContextBuilder(metadataRepo, researchRepo);
  const canonFactRepo = await getCanonFactRepository();
  const autocompleteContext = new AutocompleteContextBuilder(
    aiContextBuilder,
    canonFactRepo
  );

  // Resolve local canon context (behind a flag): which known characters appear in
  // the local window, and the current chapter index for temporal fact selection.
  let entities: string[] | undefined;
  let chapterIndex: number | undefined;
  if (CANON_CONTEXT_ENABLED && chapterId && project) {
    const chapters = project.getChapters();
    const idx = chapters.findIndex((c) => c.getId() === chapterId);
    if (idx >= 0) {
      chapterIndex = idx;
      const characterRepo = await getCharacterRepository();
      const characters = await characterRepo.findByProjectId(userId, projectId);
      entities = detectEntities(textBeforeCursor, characters.map((c) => c.getName()));
    }
  }

  const { context: baseContext, canonFactsCount } =
    await autocompleteContext.buildContext({
      ownerId: userId,
      projectId,
      chapterId,
      includeCanon: CANON_CONTEXT_ENABLED,
      entities,
      chapterIndex,
    });
  // Prepend the (optional) intent directive so it sits near the top of the context.
  const projectContext = intentDirective(intent) + baseContext;

  // 5. Create streaming response
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

        for await (const chunk of generator) {
          // Send as Server-Sent Event
          const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send done event
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
