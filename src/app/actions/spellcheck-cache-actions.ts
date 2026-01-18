// ABOUTME: Server Actions for spell check caching and auto-check functionality.
// ABOUTME: Integrates caching to avoid redundant AI API calls and save costs.

'use server';

import { LoadSpellCheckCacheUseCase } from '@/application/use-cases/LoadSpellCheckCacheUseCase';
import { SaveSpellCheckCacheUseCase } from '@/application/use-cases/SaveSpellCheckCacheUseCase';
import { UpdateSpellCheckCacheUseCase } from '@/application/use-cases/UpdateSpellCheckCacheUseCase';
import { DeleteSpellCheckCacheUseCase } from '@/application/use-cases/DeleteSpellCheckCacheUseCase';
import { CheckSpellingAndGrammarUseCase } from '@/application/use-cases/CheckSpellingAndGrammarUseCase';
import { UpdateProjectAutoSpellCheckUseCase } from '@/application/use-cases/UpdateProjectAutoSpellCheckUseCase';
import { extractTextFromTipTapJSON } from '@/infrastructure/document/utils/tiptap-conversion';
import { hashText } from '@/infrastructure/utils/text-hash';
import {
  ActionResult,
  getAuthenticatedUserId,
  getSpellCheckCacheRepo,
  getRepository,
  getIdGenerator,
  getLLMProviderForProject,
  withErrorHandling,
} from './utils';

interface SpellCheckCorrectionDTO {
  original: string;
  corrected: string;
  type: 'spelling' | 'grammar' | 'style' | 'punctuation';
  explanation: string;
  typeLabel: string;
}

interface SpellCheckCacheDTO {
  id: string;
  chapterId: string;
  projectId: string;
  contentHash: string;
  corrections: SpellCheckCorrectionDTO[];
  correctionCount: number;
  hasErrors: boolean;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Load spell check cache for a chapter.
 * Returns cached corrections if valid, or indicates cache is stale.
 */
export async function loadSpellCheckCache(
  chapterId: string,
  content: string
): Promise<ActionResult<SpellCheckCacheDTO | null>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  return withErrorHandling(async () => {
    const cacheRepo = await getSpellCheckCacheRepo();

    // Compute content hash
    const contentHash = hashText(content);

    const useCase = new LoadSpellCheckCacheUseCase(cacheRepo);
    const result = await useCase.execute({
      ownerId: userId,
      chapterId,
      contentHash,
    });

    if (!result.cache) {
      return null;
    }

    const dto = result.cache.toDTO();
    return {
      ...dto,
      corrections: dto.corrections.map((c) => ({
        ...c,
        typeLabel: getTypeLabel(c.type),
      })),
      isStale: !result.isValid,
    };
  });
}

/**
 * Check spelling and grammar with caching.
 * Uses cached results if valid, otherwise runs AI check and caches results.
 */
export async function checkSpellingWithCache(
  projectId: string,
  chapterId: string,
  content: string,
  language?: string
): Promise<ActionResult<SpellCheckCacheDTO>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Content is required' };
  }

  return withErrorHandling(async () => {
    const startTime = performance.now();
    const cacheRepo = await getSpellCheckCacheRepo();
    const projectRepo = await getRepository();
    const idGenerator = await getIdGenerator();

    // Compute content hash
    const contentHash = hashText(content);

    // Try to load from cache first
    const loadUseCase = new LoadSpellCheckCacheUseCase(cacheRepo);
    const cacheResult = await loadUseCase.execute({
      ownerId: userId,
      chapterId,
      contentHash,
    });

    if (cacheResult.cache && cacheResult.isValid) {
      // Cache hit - return cached corrections
      if (process.env.NODE_ENV === 'development') {
        const duration = performance.now() - startTime;
        console.log(`[SpellCheck] Cache hit in ${duration.toFixed(2)}ms`);
      }

      const dto = cacheResult.cache.toDTO();
      return {
        ...dto,
        corrections: dto.corrections.map((c) => ({
          ...c,
          typeLabel: getTypeLabel(c.type),
        })),
        isStale: false,
      };
    }

    // Cache miss or stale - run AI spell check
    const llmProvider = await getLLMProviderForProject(userId, projectId);

    // Extract plain text from TipTap JSON if needed
    let textToCheck = content;
    try {
      const tiptapJson = JSON.parse(content);
      textToCheck = extractTextFromTipTapJSON(tiptapJson);
    } catch {
      textToCheck = content;
    }

    const checkUseCase = new CheckSpellingAndGrammarUseCase(llmProvider);
    const checkResult = await checkUseCase.execute(textToCheck, language);

    // Save results to cache
    const saveUseCase = new SaveSpellCheckCacheUseCase(
      cacheRepo,
      projectRepo,
      idGenerator
    );

    const saveResult = await saveUseCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      contentHash,
      corrections: checkResult.corrections.map((c) => ({
        original: c.original,
        corrected: c.corrected,
        type: c.type,
        explanation: c.explanation,
      })),
    });

    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SpellCheck] API call completed in ${duration.toFixed(2)}ms`);
      console.log(`[SpellCheck] Found ${checkResult.corrections.length} corrections`);
    }

    const dto = saveResult.cache.toDTO();
    return {
      ...dto,
      corrections: dto.corrections.map((c) => ({
        ...c,
        typeLabel: getTypeLabel(c.type),
      })),
      isStale: false,
    };
  });
}

/**
 * Update spell check cache after applying a correction.
 * Removes the applied correction from cache without calling AI.
 */
export async function updateCacheAfterCorrection(
  chapterId: string,
  appliedOriginal: string,
  newContent: string
): Promise<ActionResult<SpellCheckCacheDTO | null>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  return withErrorHandling(async () => {
    const cacheRepo = await getSpellCheckCacheRepo();
    const newContentHash = hashText(newContent);

    const useCase = new UpdateSpellCheckCacheUseCase(cacheRepo);
    const result = await useCase.execute({
      ownerId: userId,
      chapterId,
      appliedOriginal,
      newContentHash,
    });

    if (!result.cache) {
      return null;
    }

    const dto = result.cache.toDTO();
    return {
      ...dto,
      corrections: dto.corrections.map((c) => ({
        ...c,
        typeLabel: getTypeLabel(c.type),
      })),
      isStale: false,
    };
  });
}

/**
 * Delete spell check cache for a chapter.
 * Called when user wants to force a fresh check.
 */
export async function deleteSpellCheckCache(
  chapterId: string
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  return withErrorHandling(async () => {
    const cacheRepo = await getSpellCheckCacheRepo();
    const useCase = new DeleteSpellCheckCacheUseCase(cacheRepo);
    await useCase.execute({
      ownerId: userId,
      chapterId,
    });
  });
}

/**
 * Update auto spell check preference for a project.
 * When enabled, spell check runs automatically when chapters load.
 */
export async function updateAutoSpellCheck(
  projectId: string,
  enabled: boolean
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const useCase = new UpdateProjectAutoSpellCheckUseCase(projectRepo);
    await useCase.execute({
      ownerId: userId,
      projectId,
      enabled,
    });
  });
}

/**
 * Get user-friendly label for correction type.
 */
function getTypeLabel(type: 'spelling' | 'grammar' | 'style' | 'punctuation'): string {
  switch (type) {
    case 'spelling':
      return 'Orthographe';
    case 'grammar':
      return 'Grammaire';
    case 'style':
      return 'Style';
    case 'punctuation':
      return 'Ponctuation';
    default:
      return 'Correction';
  }
}
