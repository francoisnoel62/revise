// ABOUTME: Server actions for the AI transparency ledger (captured exchange content)
// ABOUTME: Lists metadata, decrypts a single exchange on demand, and manages opt-in/retention

'use server';

import {
  getAuthenticatedUserId,
  getAIExchangeRepo,
  getUserRepo,
  ActionResult,
  withErrorHandling,
} from './utils';
import {
  AIOperationType,
  isValidAIOperationType,
} from '@/domain/value-objects/AIOperationType';
import { DEFAULT_AI_EXCHANGE_RETENTION_DAYS } from '@/domain/entities/User';

const MIN_RETENTION_DAYS = 1;
const MAX_RETENTION_DAYS = 365;

export interface SerializedExchangeSummary {
  id: string;
  projectId: string;
  operation: AIOperationType;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costEur: number | null;
  durationMs: number | null;
  createdAt: string;
}

export interface SerializedExchangeDetail extends SerializedExchangeSummary {
  systemPrompt: string;
  input: string;
  output: string;
  cachedInputTokens: number | null;
  expiresAt: string;
}

export interface AIExchangeLoggingSettings {
  enabled: boolean;
  retentionDays: number;
}

export interface ListExchangeFilters {
  projectId?: string;
  operation?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * List the current user's captured exchanges as metadata-only summaries.
 * Never decrypts content. Filters apply to metadata only.
 */
export async function listAIExchangesAction(
  filters?: ListExchangeFilters
): Promise<ActionResult<SerializedExchangeSummary[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIExchangeRepo();
    const operation =
      filters?.operation && isValidAIOperationType(filters.operation)
        ? filters.operation
        : undefined;

    const summaries = await repo.findByOwner(auth.userId, {
      projectId: filters?.projectId,
      operation,
      model: filters?.model,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      limit: filters?.limit,
      offset: filters?.offset,
    });

    return summaries.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      operation: s.operation,
      provider: s.provider,
      model: s.model,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      costEur: s.costEur,
      durationMs: s.durationMs,
      createdAt: s.createdAt.toISOString(),
    }));
  });
}

/**
 * Fetch and decrypt a single exchange the current user owns.
 * This is the only path that decrypts content.
 */
export async function getAIExchangeAction(
  id: string
): Promise<ActionResult<SerializedExchangeDetail | null>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIExchangeRepo();
    const exchange = await repo.findById(auth.userId, id);
    if (!exchange) {
      return null;
    }

    return {
      id: exchange.getId(),
      projectId: exchange.getProjectId(),
      operation: exchange.getOperation(),
      provider: exchange.getProvider(),
      model: exchange.getModel(),
      inputTokens: exchange.getInputTokens(),
      outputTokens: exchange.getOutputTokens(),
      cachedInputTokens: exchange.getCachedInputTokens(),
      costEur: exchange.getCostEur(),
      durationMs: exchange.getDurationMs(),
      systemPrompt: exchange.getSystemPrompt(),
      input: exchange.getInput(),
      output: exchange.getOutput(),
      createdAt: exchange.getCreatedAt().toISOString(),
      expiresAt: exchange.getExpiresAt().toISOString(),
    };
  });
}

/**
 * Read the current user's exchange-logging preferences.
 */
export async function getAIExchangeLoggingAction(): Promise<
  ActionResult<AIExchangeLoggingSettings>
> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const userRepo = await getUserRepo();
    const user = await userRepo.findById(auth.userId);
    return {
      enabled: user?.aiExchangeLoggingEnabled ?? false,
      retentionDays:
        user?.aiExchangeRetentionDays ?? DEFAULT_AI_EXCHANGE_RETENTION_DAYS,
    };
  });
}

/**
 * Update the current user's opt-in and retention window. Enabling requires the
 * server-side encryption key to be configured, otherwise content cannot be
 * stored securely and the request is rejected.
 */
export async function setAIExchangeLoggingAction(
  enabled: boolean,
  retentionDays: number
): Promise<ActionResult<AIExchangeLoggingSettings>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const days = Math.round(retentionDays);
    if (days < MIN_RETENTION_DAYS || days > MAX_RETENTION_DAYS) {
      throw new Error(
        `La durée de conservation doit être comprise entre ${MIN_RETENTION_DAYS} et ${MAX_RETENTION_DAYS} jours`
      );
    }

    if (enabled) {
      // Fail fast if content could not be encrypted at rest.
      try {
        await getAIExchangeRepo();
      } catch {
        throw new Error(
          "La journalisation du contenu est indisponible : la clé de chiffrement n'est pas configurée sur le serveur."
        );
      }
    }

    const userRepo = await getUserRepo();
    const updated = await userRepo.updateAIExchangeLogging(
      auth.userId,
      enabled,
      days
    );
    if (!updated) {
      throw new Error('Utilisateur introuvable');
    }

    return { enabled, retentionDays: days };
  });
}

/**
 * Permanently delete all captured exchanges for the current user.
 */
export async function purgeAIExchangesAction(): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getAIExchangeRepo();
    await repo.deleteAllByOwner(auth.userId);
  });
}
