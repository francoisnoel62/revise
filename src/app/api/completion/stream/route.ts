// ABOUTME: Streaming API route for text autocompletion
// ABOUTME: Uses Server-Sent Events (SSE) to stream AI-generated text

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { TipTapContentService } from '@/infrastructure/document/utils/TipTapContentService';
import { MongoDBMetadataRepository } from '@/infrastructure/persistence/MongoDBMetadataRepository';
import { MongoDBProviderRepository } from '@/infrastructure/persistence/MongoDBProviderRepository';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { AnthropicProvider } from '@/infrastructure/ai/AnthropicProvider';
import { FilePromptRepository } from '@/infrastructure/prompts/FilePromptRepository';
import { getDbConnection } from '@/infrastructure/persistence/mongodb';
import { metadataCache, CachedMetadata } from '@/infrastructure/cache/MetadataCache';
import {
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
} from '@/domain';

export const runtime = 'nodejs';

interface CompletionRequest {
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await getServerSession(authOptions);
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

  // 3. Get LLM provider
  const db = await getDbConnection();
  const providerRepo = new MongoDBProviderRepository(db);
  const promptRepo = new FilePromptRepository();

  // Try to get user's configured provider
  const providers = await providerRepo.findByOwnerId(userId);
  const defaultProvider = providers.find((p) => p.isDefault) || providers[0];

  let llmProvider;

  if (defaultProvider) {
    const decryptedKey = defaultProvider.getDecryptedApiKey();
    if (defaultProvider.getType() === 'anthropic') {
      llmProvider = new AnthropicProvider(
        decryptedKey,
        promptRepo,
        defaultProvider.getModel()
      );
    } else {
      llmProvider = new OpenAIProvider(
        decryptedKey,
        promptRepo,
        defaultProvider.getModel()
      );
    }
  } else if (process.env.OPENAI_API_KEY) {
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
    const metadataRepo = new MongoDBMetadataRepository(db);
    const contentConverter = new TipTapContentService();
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
        const generator = llmProvider.generateCompletionStream(
          textBeforeCursor,
          textAfterCursor,
          metadata
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
  metadataRepo: MongoDBMetadataRepository,
  contentConverter: TipTapContentService,
  ownerId: string,
  projectId: string
): Promise<{
  narrative?: NarrativeAnalysis;
  stylisticDNA?: StylisticDNA;
  characters?: Characters;
  plot?: Plot;
}> {
  const result: {
    narrative?: NarrativeAnalysis;
    stylisticDNA?: StylisticDNA;
    characters?: Characters;
    plot?: Plot;
  } = {};

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
