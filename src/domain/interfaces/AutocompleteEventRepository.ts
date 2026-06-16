// ABOUTME: Repository interface for AutocompleteEvent persistence (instrumentation)
// ABOUTME: Defines storing one record per suggestion + the post-insertion deletion patch and stats

import { AutocompleteEvent } from '../entities/AutocompleteEvent';
import { AutocompleteOutcome } from '../value-objects/AutocompleteOutcome';

export interface AutocompleteStats {
  total: number;
  byOutcome: Record<AutocompleteOutcome, number>;
  byProviderModel: AutocompleteProviderModelStats[];
  acceptanceRate: number; // accepted_full / total
  partialAcceptanceRate: number; // accepted_partial / total
  postInsertionDeletionRate: number; // accepted then deleted / accepted_full
  firstTokenMsP50: number | null;
  firstTokenMsP95: number | null;
  totalMsP50: number | null;
}

export interface AutocompleteProviderModelStats {
  providerType: string | null;
  model: string | null;
  total: number;
  acceptanceRate: number;
  firstTokenMsP50: number | null;
  firstTokenMsP95: number | null;
}

export interface AutocompleteEventRepository {
  save(event: AutocompleteEvent): Promise<AutocompleteEvent>;

  markDeletedAfterInsert(
    ownerId: string,
    suggestionId: string,
    deletedAfterMs: number
  ): Promise<void>;

  getStatsByProject(
    ownerId: string,
    projectId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<AutocompleteStats>;

  deleteAllByOwner(ownerId: string): Promise<void>;
}
