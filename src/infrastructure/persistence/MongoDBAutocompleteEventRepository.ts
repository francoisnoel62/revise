// ABOUTME: MongoDB implementation of AutocompleteEventRepository (instrumentation)
// ABOUTME: One document per suggestion; multi-tenant isolation by ownerId

import { Db } from 'mongodb';
import {
  AutocompleteEventRepository,
  AutocompleteProviderModelStats,
  AutocompleteStats,
} from '@/domain/interfaces/AutocompleteEventRepository';
import { AutocompleteEvent } from '@/domain/entities/AutocompleteEvent';
import {
  AUTOCOMPLETE_OUTCOMES,
  AutocompleteOutcome,
} from '@/domain/value-objects/AutocompleteOutcome';
import {
  AutocompleteEventDocument,
  serializeAutocompleteEvent,
} from './autocomplete-event-serializer';

const COLLECTION_NAME = 'autocompleteEvents';

interface ProviderModelAccumulator {
  providerType: string | null;
  model: string | null;
  total: number;
  accepted: number;
  firstTokenValues: number[];
}

/**
 * Linear-interpolation percentile, computed in JS to stay independent of the
 * MongoDB server version (avoids the 7.0-only `$percentile` operator).
 */
function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const rank = p * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

export class MongoDBAutocompleteEventRepository
  implements AutocompleteEventRepository
{
  constructor(private readonly db: Db) {}

  private collection() {
    return this.db.collection<AutocompleteEventDocument>(COLLECTION_NAME);
  }

  async ensureIndexes(): Promise<void> {
    await this.collection().createIndex({ ownerId: 1, projectId: 1, createdAt: -1 });
    await this.collection().createIndex(
      { ownerId: 1, suggestionId: 1 },
      { unique: true }
    );
  }

  async save(event: AutocompleteEvent): Promise<AutocompleteEvent> {
    await this.collection().insertOne(serializeAutocompleteEvent(event));
    return event;
  }

  async markDeletedAfterInsert(
    ownerId: string,
    suggestionId: string,
    deletedAfterMs: number
  ): Promise<void> {
    await this.collection().updateOne(
      { ownerId, suggestionId },
      { $set: { deletedAfterMs } }
    );
  }

  async getStatsByProject(
    ownerId: string,
    projectId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<AutocompleteStats> {
    const filter: Record<string, unknown> = { ownerId, projectId };
    if (options?.startDate || options?.endDate) {
      const range: Record<string, Date> = {};
      if (options.startDate) range.$gte = options.startDate;
      if (options.endDate) range.$lte = options.endDate;
      filter.createdAt = range;
    }

    const docs = await this.collection()
      .find(filter, {
        projection: {
          outcome: 1,
          firstTokenMs: 1,
          totalMs: 1,
          deletedAfterMs: 1,
          providerType: 1,
          model: 1,
        },
      })
      .toArray();

    const byOutcome = Object.fromEntries(
      AUTOCOMPLETE_OUTCOMES.map((o) => [o, 0])
    ) as Record<AutocompleteOutcome, number>;

    const firstTokenValues: number[] = [];
    const totalValues: number[] = [];
    const providerModels = new Map<string, ProviderModelAccumulator>();
    let acceptedDeleted = 0;

    for (const doc of docs) {
      byOutcome[doc.outcome] = (byOutcome[doc.outcome] ?? 0) + 1;
      if (typeof doc.firstTokenMs === 'number') firstTokenValues.push(doc.firstTokenMs);
      if (typeof doc.totalMs === 'number') totalValues.push(doc.totalMs);
      if (doc.outcome === 'accepted_full' && typeof doc.deletedAfterMs === 'number') {
        acceptedDeleted += 1;
      }

      const providerType = typeof doc.providerType === 'string' ? doc.providerType : null;
      const model = typeof doc.model === 'string' ? doc.model : null;
      const key = `${providerType ?? '__unknown_provider__'}\u0000${model ?? '__unknown_model__'}`;
      const providerModel = providerModels.get(key) ?? {
        providerType,
        model,
        total: 0,
        accepted: 0,
        firstTokenValues: [],
      };
      providerModel.total += 1;
      if (doc.outcome === 'accepted_full') providerModel.accepted += 1;
      if (typeof doc.firstTokenMs === 'number') {
        providerModel.firstTokenValues.push(doc.firstTokenMs);
      }
      providerModels.set(key, providerModel);
    }

    const total = docs.length;
    const accepted = byOutcome.accepted_full;

    return {
      total,
      byOutcome,
      byProviderModel: this.toProviderModelStats(providerModels),
      acceptanceRate: total === 0 ? 0 : accepted / total,
      partialAcceptanceRate: total === 0 ? 0 : byOutcome.accepted_partial / total,
      postInsertionDeletionRate: accepted === 0 ? 0 : acceptedDeleted / accepted,
      firstTokenMsP50: percentile(firstTokenValues, 0.5),
      firstTokenMsP95: percentile(firstTokenValues, 0.95),
      totalMsP50: percentile(totalValues, 0.5),
    };
  }

  async deleteAllByOwner(ownerId: string): Promise<void> {
    await this.collection().deleteMany({ ownerId });
  }

  private toProviderModelStats(
    providerModels: Map<string, ProviderModelAccumulator>
  ): AutocompleteProviderModelStats[] {
    return [...providerModels.values()]
      .map((entry) => ({
        providerType: entry.providerType,
        model: entry.model,
        total: entry.total,
        acceptanceRate: entry.total === 0 ? 0 : entry.accepted / entry.total,
        firstTokenMsP50: percentile(entry.firstTokenValues, 0.5),
        firstTokenMsP95: percentile(entry.firstTokenValues, 0.95),
      }))
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        const aLabel = `${a.providerType ?? ''} ${a.model ?? ''}`;
        const bLabel = `${b.providerType ?? ''} ${b.model ?? ''}`;
        return aLabel.localeCompare(bLabel);
      });
  }
}
