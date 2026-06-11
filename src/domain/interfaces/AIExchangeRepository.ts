// ABOUTME: Repository interface for AIExchange persistence (captured AI exchange content)
// ABOUTME: List queries return metadata-only summaries; content is decrypted only on detail fetch

import { AIExchange } from '../entities/AIExchange';
import { AIOperationType } from '../value-objects/AIOperationType';

/**
 * Metadata-only projection of an exchange for the table view. Deliberately
 * excludes the encrypted content fields: the list never decrypts.
 */
export interface AIExchangeSummary {
  id: string;
  projectId: string;
  operation: AIOperationType;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costEur: number | null;
  durationMs: number | null;
  createdAt: Date;
}

export interface AIExchangeFilters {
  projectId?: string;
  operation?: AIOperationType;
  model?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AIExchangeRepository {
  save(exchange: AIExchange): Promise<AIExchange>;

  /** Returns metadata-only summaries for the owner, newest first. No decryption. */
  findByOwner(
    userId: string,
    filters?: AIExchangeFilters
  ): Promise<AIExchangeSummary[]>;

  /** Returns the full, decrypted exchange, or null when not found / not owned. */
  findById(userId: string, id: string): Promise<AIExchange | null>;

  /** Distinct model identifiers used by the owner, for filter facets. */
  distinctModels(userId: string): Promise<string[]>;

  deleteAllByOwner(userId: string): Promise<void>;

  ensureIndexes(): Promise<void>;
}
