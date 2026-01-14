// ABOUTME: Streaming API route for text autocompletion
// ABOUTME: Uses Server-Sent Events (SSE) to stream AI-generated text

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getMetadataRepository,
  getPromptRepository,
  getContentConverter,
  createLLMProvider,
} from '@/infrastructure/config/providers';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { metadataCache, CachedMetadata } from '@/infrastructure/cache/MetadataCache';
import {
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
} from '@/domain';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { ContentConverter } from '@/domain/interfaces/ContentConverter';

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

  // Try to get user's configured provider (use first available)
  const providers = await providerRepo.listProviders(userId);
  const defaultProvider = providers[0];

  let llmProvider;

  if (defaultProvider) {
    console.log('[Autocomplete] Using provider:', defaultProvider.getName(), '(', defaultProvider.getType(), ')', 'model:', defaultProvider.getModel());
    llmProvider = createLLMProvider(defaultProvider);
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

  // 4. Load metadata for context (with caching)
  let metadata = metadataCache.get(userId, projectId);

  if (!metadata) {
    const metadataRepo = await getMetadataRepository();
    const contentConverter = getContentConverter();
    metadata = await loadProjectMetadata(
      metadataRepo,
      contentConverter,
      userId,
      projectId
    );
    metadataCache.set(userId, projectId, metadata);
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
          metadata
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

/**
 * Load relevant project metadata for completion context.
 */
async function loadProjectMetadata(
  metadataRepo: MetadataRepository,
  contentConverter: ContentConverter,
  ownerId: string,
  projectId: string
): Promise<CachedMetadata> {
  const result: CachedMetadata = {};

  try {
    const metadataList = await metadataRepo.findByProjectId(ownerId, projectId);

    for (const metadata of metadataList) {
      const typeKey = metadata.getTypeKey();
      const content = metadata.getContent();

      try {
        const text = contentConverter.extractText(content);

        switch (typeKey) {
          case 'narrative-analysis':
            result.narrative = parseNarrativeFromText(text);
            break;
          case 'stylistic-dna':
            result.stylisticDNA = parseStylisticDNAFromText(text);
            break;
          case 'characters':
            result.characters = parseCharactersFromText(text);
            break;
          case 'plot':
            result.plot = parsePlotFromText(text);
            break;
        }
      } catch {
        // Skip metadata with invalid content
      }
    }
  } catch {
    // If metadata loading fails, continue without it
  }

  return result;
}

function extractSection(text: string, keyword: string): string {
  const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseNarrativeFromText(text: string): NarrativeAnalysis {
  return {
    narratorType: extractSection(text, 'Narrateur') || text.substring(0, 100),
    focalization: extractSection(text, 'Focalisation') || '',
    temporality: extractSection(text, 'Temporalité') || '',
    chapterStructure: '',
    narrativeVoice: [],
    summary: '',
  };
}

function parseStylisticDNAFromText(text: string): StylisticDNA {
  return {
    registerAndLexicon: extractSection(text, 'Registre') || text.substring(0, 100),
    syntax: '',
    figuresOfStyle: '',
    ticsAndSignatures: '',
    rhythmAndBreathing: extractSection(text, 'Rythme') || '',
    writingRules: [],
    summary: '',
  };
}

function parseCharactersFromText(text: string): Characters {
  return {
    characterProfiles: [],
    relationalMap: text.substring(0, 200),
    narrativeHierarchy: '',
    summary: '',
  };
}

function parsePlotFromText(text: string): Plot {
  return {
    initialSituation: '',
    incitingIncident: '',
    stakes: '',
    dramaticQuestions: '',
    conflicts: '',
    narrativeThreads: '',
    detectedStructure: '',
    sceneBreakdown: [],
    plotState: extractSection(text, 'État') || text.substring(0, 100),
    possibleDirections: '',
    summary: '',
  };
}
