// ABOUTME: Server Actions for Canon Ledger CRUD and generation.
// ABOUTME: Delegates to Application layer use cases; author facts survive re-extraction.

'use server';

import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getCanonFactRepo,
  getCharacterRepo,
  getIdGenerator,
  getRateLimitRepo,
  getTrackedLLMProviderById,
  withErrorHandling,
} from './utils';
import { CanonFact } from '@/domain/entities/CanonFact';
import { GenerateCanonFactsUseCase } from '@/application/use-cases/GenerateCanonFactsUseCase';
import { extractProjectFullText } from '@/application/services/project-text';
import { hashText } from '@/application/utils/text-hash';

// Canon-fact (re)generation is an expensive LLM operation; throttle it per
// project so one project's generation never blocks another's (see the per-user
// regression this replaced) while still preventing rapid re-runs of the same one.
const CANON_FACTS_WINDOW_MS = 30_000; // 30 seconds
const CANON_FACTS_MAX_PER_WINDOW = 1;

export interface SerializedCanonFact {
  id: string;
  entity: string;
  statement: string;
  validFromChapter: number;
  validToChapter: number | null;
  source: 'derived' | 'author';
  sourceChapterId: string | null;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

function serializeCanonFact(fact: CanonFact): SerializedCanonFact {
  return {
    id: fact.getId(),
    entity: fact.getEntity(),
    statement: fact.getStatement(),
    validFromChapter: fact.getValidFromChapter(),
    validToChapter: fact.getValidToChapter(),
    source: fact.getSource(),
    sourceChapterId: fact.getSourceChapterId(),
    contentHash: fact.getContentHash(),
    createdAt: fact.getCreatedAt().toISOString(),
    updatedAt: fact.getUpdatedAt().toISOString(),
  };
}

export async function listCanonFactsAction(
  projectId: string
): Promise<ActionResult<{ facts: SerializedCanonFact[] }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getCanonFactRepo();
    const facts = await repo.listByProject(auth.userId, projectId);
    return { facts: facts.map(serializeCanonFact) };
  });
}

export async function createCanonFactAction(
  projectId: string,
  data: {
    entity: string;
    statement: string;
    validFromChapter: number;
    validToChapter: number | null;
  }
): Promise<ActionResult<{ fact: SerializedCanonFact }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    // Guard: only write facts to a project the user actually owns. ownerId already
    // isolates tenants, but this stops a client from seeding its own namespace with
    // facts under an arbitrary (non-owned) projectId.
    const projectRepo = await getRepository();
    const project = await projectRepo.loadProject(auth.userId, projectId);
    if (!project) throw new Error('Projet introuvable');

    const idGen = await getIdGenerator();
    const repo = await getCanonFactRepo();

    const fact = CanonFact.create({
      id: idGen.generate(),
      ownerId: auth.userId,
      projectId,
      entity: data.entity.trim(),
      statement: data.statement.trim(),
      validFromChapter: data.validFromChapter,
      validToChapter: data.validToChapter,
      source: 'author',
      sourceChapterId: null,
      contentHash: null,
    });

    await repo.save(fact);
    return { fact: serializeCanonFact(fact) };
  });
}

export async function updateCanonFactAction(
  projectId: string,
  factId: string,
  data: {
    entity?: string;
    statement?: string;
    validFromChapter?: number;
    validToChapter?: number | null;
  }
): Promise<ActionResult<{ fact: SerializedCanonFact }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getCanonFactRepo();
    const facts = await repo.listByProject(auth.userId, projectId);
    const existing = facts.find((f) => f.getId() === factId);
    if (!existing) throw new Error('Fait introuvable');

    const updated = CanonFact.reconstruct({
      id: existing.getId(),
      ownerId: existing.getOwnerId(),
      projectId: existing.getProjectId(),
      entity: (data.entity ?? existing.getEntity()).trim(),
      statement: (data.statement ?? existing.getStatement()).trim(),
      validFromChapter: data.validFromChapter ?? existing.getValidFromChapter(),
      validToChapter:
        data.validToChapter !== undefined
          ? data.validToChapter
          : existing.getValidToChapter(),
      source: 'author',
      sourceChapterId: existing.getSourceChapterId(),
      contentHash: existing.getContentHash(),
      createdAt: existing.getCreatedAt(),
      updatedAt: new Date(),
    });

    await repo.update(auth.userId, updated);
    return { fact: serializeCanonFact(updated) };
  });
}

export async function deleteCanonFactAction(
  projectId: string,
  factId: string
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getCanonFactRepo();
    await repo.delete(auth.userId, factId);
  });
}

export async function generateCanonFactsAction(
  projectId: string,
  providerId: string
): Promise<ActionResult<{ factCount: number; characterCount: number }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // Cooldown scoped per (user, project), backed by the shared store so it holds
  // across serverless instances (an in-memory counter resets on cold start and
  // counts per-instance). One generation per 30s window per project. If the
  // limiter store is unavailable we fail OPEN: a counter outage must not lock an
  // author out of (re)building their canon.
  try {
    const rateLimitRepo = await getRateLimitRepo();
    const quota = await rateLimitRepo.consumeFixedWindow(
      `canon-facts:${auth.userId}:${projectId}`,
      CANON_FACTS_WINDOW_MS,
      CANON_FACTS_MAX_PER_WINDOW
    );
    if (!quota.allowed) {
      return {
        success: false,
        error: `Veuillez attendre ${quota.retryAfterSeconds ?? 30}s avant de régénérer le canon.`,
      };
    }
  } catch (error) {
    console.error('[Canon facts] rate-limit check failed:', error);
  }

  return withErrorHandling(async () => {
    const canonRepo = await getCanonFactRepo();
    const projectRepo = await getRepository();
    const characterRepo = await getCharacterRepo();
    const idGen = await getIdGenerator();
    const llm = await getTrackedLLMProviderById(auth.userId, providerId, projectId);

    const useCase = new GenerateCanonFactsUseCase(
      canonRepo,
      projectRepo,
      characterRepo,
      llm,
      idGen
    );

    const result = await useCase.execute({ ownerId: auth.userId, projectId });
    return { factCount: result.factCount, characterCount: result.characterCount };
  });
}

export async function checkCanonFreshnessAction(
  projectId: string
): Promise<ActionResult<{ isStale: boolean; currentHash: string | null }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const canonRepo = await getCanonFactRepo();

    const project = await projectRepo.loadProject(auth.userId, projectId);
    if (!project) throw new Error('Project not found');

    const chapters = project.getChapters();
    const currentHash =
      chapters.length > 0 ? hashText(extractProjectFullText(chapters)) : null;

    const facts = await canonRepo.listByProject(auth.userId, projectId);
    const derivedFacts = facts.filter((f) => f.getSource() === 'derived');

    const isStale =
      derivedFacts.length > 0 &&
      derivedFacts.some((f) => f.getContentHash() !== currentHash);

    return { isStale, currentHash };
  });
}
