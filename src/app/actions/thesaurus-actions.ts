// ABOUTME: Server actions for the contextual thesaurus feature
// ABOUTME: Two actions: fast lexical lookup (layer 1) and AI suggestions (layer 1 + 2)

'use server';

import { SuggestAlternativesUseCase } from '@/application/use-cases/SuggestAlternativesUseCase';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { JeuxDeMotsThesaurus } from '@/infrastructure/lexical';
import { getDatabase } from '@/infrastructure/config/database';
import {
  ActionResult,
  getAuthenticatedUserId,
  getMetadataRepo,
  getTrackedLLMProviderForProject,
  withErrorHandling,
} from './utils';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface WordAlternativeDTO {
  word: string;
  sceneEffect: string;
  register?: string;
}

export interface LexicalAlternativesResult {
  layer1: string[];
}

export interface AIAlternativesResult {
  layer1: string[];
  layer2: WordAlternativeDTO[];
  voiceAnchored: boolean;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Layer 1 — lexical only, 0 AI tokens, <10ms.
 * Returns synonyms from the JeuxDeMots index without any LLM call.
 */
export async function getLexicalAlternativesAction(
  projectId: string,
  word: string
): Promise<ActionResult<LexicalAlternativesResult>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!projectId || !projectId.trim()) {
    return { success: false, error: 'Project ID is required' };
  }

  if (!word || !word.trim()) {
    return { success: false, error: 'Word is required' };
  }

  return withErrorHandling(async () => {
    const db = await getDatabase();
    const thesaurus = new JeuxDeMotsThesaurus(db);
    const layer1 = await thesaurus.lookup(word);
    return { layer1 };
  });
}

/**
 * Layer 1 + 2 — lexical synonyms + AI alternatives justified by scene effect.
 * Anchors proposals on the project's Stylistic DNA when available.
 */
export async function getAIAlternativesAction(
  projectId: string,
  word: string,
  sentence: string
): Promise<ActionResult<AIAlternativesResult>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!projectId || !projectId.trim()) {
    return { success: false, error: 'Project ID is required' };
  }

  if (!word || !word.trim()) {
    return { success: false, error: 'Word is required' };
  }

  if (!sentence || !sentence.trim()) {
    return { success: false, error: 'Sentence is required' };
  }

  return withErrorHandling(async () => {
    const [db, llmProvider, metadataRepo] = await Promise.all([
      getDatabase(),
      getTrackedLLMProviderForProject(auth.userId, projectId),
      getMetadataRepo(),
    ]);

    const useCase = new SuggestAlternativesUseCase(
      new AIContextBuilder(metadataRepo),
      llmProvider,
      new JeuxDeMotsThesaurus(db)
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      word,
      sentence,
      includeAILayer: true,
    });

    // Serialize WordAlternative domain objects to plain DTOs
    const layer2: WordAlternativeDTO[] = (result.layer2 ?? []).map((alt) => ({
      word: alt.word,
      sceneEffect: alt.sceneEffect,
      ...(alt.register !== undefined ? { register: alt.register } : {}),
    }));

    return {
      layer1: result.layer1,
      layer2,
      voiceAnchored: result.voiceAnchored,
    };
  });
}
