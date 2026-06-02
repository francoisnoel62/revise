// ABOUTME: Streaming API route for text autocompletion
// ABOUTME: Uses Server-Sent Events (SSE) to stream AI-generated text

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getMetadataRepository,
  getPromptRepository,
  createLLMProvider,
} from '@/infrastructure/config/providers';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { metadataCache } from '@/infrastructure/cache/MetadataCache';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';

export const runtime = 'nodejs';

interface CompletionRequest {
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
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

  const { projectId, textBeforeCursor, textAfterCursor } = body;

  if (!projectId || !textBeforeCursor) {
    return new Response('Missing required fields', { status: 400 });
  }

  // 3. Get LLM provider via composition root
  const providerRepo = await getProviderRepository();
  const promptRepo = getPromptRepository();
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
    console.log('[Autocomplete] Using provider:', selectedProvider.getName(), '(', selectedProvider.getType(), ')', 'model:', selectedProvider.getModel());
    llmProvider = createLLMProvider(selectedProvider);
  } else if (process.env.OPENAI_API_KEY) {
    // Fallback to environment variable (development only)
    llmProvider = new OpenAIProvider(
      process.env.OPENAI_API_KEY,
      promptRepo,
      'gpt-4o-mini'
    );
  } else {
    return new Response('No AI provider configured', { status: 400 });
  }

  // 4. Build completion context block (with caching)
  let projectContext = metadataCache.get(userId, projectId);

  if (projectContext === null) {
    const metadataRepo = await getMetadataRepository();
    const builder = new AIContextBuilder(metadataRepo);
    projectContext = await builder.buildCompletionContext(userId, projectId);
    metadataCache.set(userId, projectId, projectContext);
  }

  // 5. Create streaming response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('[Autocomplete] Starting stream...');
        const generator = llmProvider.generateCompletionStream(
          textBeforeCursor,
          textAfterCursor,
          projectContext
        );

        let chunkCount = 0;
        for await (const chunk of generator) {
          chunkCount++;
          // Send as Server-Sent Event
          const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        console.log('[Autocomplete] Stream finished, chunks received:', chunkCount);

        // Send done event
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('[Autocomplete] Stream error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
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
