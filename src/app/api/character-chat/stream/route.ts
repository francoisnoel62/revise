// ABOUTME: SSE streaming route for character chat.
// ABOUTME: Sends a meta event (conversationId) first, then streams character response chunks.

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import {
  getCharacterConversationRepository,
  getCharacterRepository,
  getMetadataRepository,
  getProjectRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderById } from '@/app/actions/utils';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { ChatWithCharacterUseCase } from '@/application/use-cases/ChatWithCharacterUseCase';
import { CharacterConversation } from '@/domain/entities/CharacterConversation';
import { objectIdGenerator } from '@/infrastructure/utils/ObjectIdGenerator';

export const runtime = 'nodejs';

interface ChatRequest {
  projectId?: string;
  characterId?: string;
  conversationId?: string | null;
  message?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { projectId, characterId, conversationId: incomingConvId, message } = body;
  if (!projectId || !characterId || !message?.trim()) {
    return new Response('Bad Request', { status: 400 });
  }

  let llmProvider;
  try {
    const projectRepo = await getProjectRepository();
    const project = await projectRepo.loadProject(userId, projectId);
    if (!project) return new Response('Project not found', { status: 404 });

    const providerId = project.getProviderId();
    if (!providerId) return new Response('No AI provider configured', { status: 400 });

    llmProvider = await getTrackedLLMProviderById(userId, providerId, projectId);
  } catch {
    return new Response('Provider error', { status: 500 });
  }

  const metadataRepo = await getMetadataRepository();
  const contextBuilder = new AIContextBuilder(metadataRepo);
  const characterRepo = await getCharacterRepository();
  const convRepo = await getCharacterConversationRepository();

  const useCase = new ChatWithCharacterUseCase(
    characterRepo,
    convRepo,
    llmProvider,
    contextBuilder,
    objectIdGenerator,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Resolve conversation before streaming so we can send the meta event first
      let resolvedConvId = incomingConvId ?? null;
      if (!resolvedConvId) {
        try {
          const newConv = CharacterConversation.create(
            objectIdGenerator.generate(),
            userId,
            projectId,
            characterId,
          );
          const saved = await convRepo.create(userId, newConv);
          resolvedConvId = saved.getId();
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to create conversation' })}\n\n`),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId: resolvedConvId })}\n\n`),
      );

      try {
        for await (const chunk of useCase.execute({
          userId,
          projectId,
          characterId,
          conversationId: resolvedConvId,
          message,
        })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`),
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`),
        );
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
