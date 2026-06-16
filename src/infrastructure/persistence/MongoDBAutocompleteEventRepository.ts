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

// Hard ceiling on the number of latency rows pulled into memory to compute
// percentiles. Counts/rates are aggregated server-side and stay exact; only the
// percentile sample is bounded (most recent events) so a large collection can
// never blow up app memory. Capping is logged — never silent.
const DEFAULT_MAX_LATENCY_SAMPLES = 50_000;

interface ProviderModelAccumulator {
  providerType: string | null;
  model: string | null;
  total: number;
  accepted: number;
  firstTokenValues: number[];
}

interface StatsGroupRow {
  _id: { providerType: string | null; model: string | null; outcome: AutocompleteOutcome };
  count: number;
  deletedCount: number;
}

interface LatencySampleRow {
  firstTokenMs: number | null;
  totalMs: number;
  providerType: string | null;
  model: string | null;
}

export interface MongoDBAutocompleteEventRepositoryOptions {
  /** Max number of recent events sampled for percentile computation. */
  maxLatencySamples?: number;
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

/** Stable map key for a (providerType, model) pair; NUL-separated to avoid collisions. */
function providerModelKey(providerType: string | null, model: string | null): string {
  const sep = String.fromCharCode(0);
  return `${providerType ?? '__unknown_provider__'}${sep}${model ?? '__unknown_model__'}`;
}

export class MongoDBAutocompleteEventRepository
  implements AutocompleteEventRepository
{
  private readonly maxLatencySamples: number;

  constructor(
    private readonly db: Db,
    options: MongoDBAutocompleteEventRepositoryOptions = {}
  ) {
    this.maxLatencySamples = options.maxLatencySamples ?? DEFAULT_MAX_LATENCY_SAMPLES;
  }

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
    const filter = this.buildFilter(ownerId, projectId, options);

    // Counts/rates are aggregated server-side: only a handful of grouped rows
    // (one per provider/model/outcome combo) ever reach the app — never the raw
    // documents — so this stays bounded regardless of collection size.
    const groups = await this.collection()
      .aggregate<StatsGroupRow>([
        { $match: filter },
        {
          $group: {
            _id: {
              providerType: '$providerType',
              model: '$model',
              outcome: '$outcome',
            },
            count: { $sum: 1 },
            deletedCount: {
              $sum: { $cond: [{ $ne: ['$deletedAfterMs', null] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const byOutcome = Object.fromEntries(
      AUTOCOMPLETE_OUTCOMES.map((o) => [o, 0])
    ) as Record<AutocompleteOutcome, number>;

    const providerModels = new Map<string, ProviderModelAccumulator>();
    let total = 0;
    let acceptedDeleted = 0;

    for (const row of groups) {
      const { outcome } = row._id;
      total += row.count;
      byOutcome[outcome] = (byOutcome[outcome] ?? 0) + row.count;
      if (outcome === 'accepted_full') acceptedDeleted += row.deletedCount;

      const providerType =
        typeof row._id.providerType === 'string' ? row._id.providerType : null;
      const model = typeof row._id.model === 'string' ? row._id.model : null;
      const key = providerModelKey(providerType, model);
      const providerModel = providerModels.get(key) ?? {
        providerType,
        model,
        total: 0,
        accepted: 0,
        firstTokenValues: [],
      };
      providerModel.total += row.count;
      if (outcome === 'accepted_full') providerModel.accepted += row.count;
      providerModels.set(key, providerModel);
    }

    const accepted = byOutcome.accepted_full;

    // Percentiles need the raw distribution, so fall back to a bounded sample of
    // the most recent events. Counts above stay exact; only percentiles reflect
    // this window when the collection exceeds the cap.
    const { firstTokenValues, totalValues } = await this.sampleLatencies(
      filter,
      total,
      providerModels
    );

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

  private buildFilter(
    ownerId: string,
    projectId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = { ownerId, projectId };
    if (options?.startDate || options?.endDate) {
      const range: Record<string, Date> = {};
      if (options.startDate) range.$gte = options.startDate;
      if (options.endDate) range.$lte = options.endDate;
      filter.createdAt = range;
    }
    return filter;
  }

  /**
   * Pull the most recent events (bounded by maxLatencySamples) and collect their
   * latency values, both globally and per provider/model. Logs a warning when the
   * cap truncates the dataset so the bound is never silent.
   */
  private async sampleLatencies(
    filter: Record<string, unknown>,
    total: number,
    providerModels: Map<string, ProviderModelAccumulator>
  ): Promise<{ firstTokenValues: number[]; totalValues: number[] }> {
    if (total > this.maxLatencySamples) {
      console.warn(
        `[Autocomplete stats] ${total} events match; sampling the ${this.maxLatencySamples} most recent for percentiles.`
      );
    }

    const docs = await this.collection()
      .find(filter, {
        projection: { firstTokenMs: 1, totalMs: 1, providerType: 1, model: 1 },
      })
      .sort({ createdAt: -1 })
      .limit(this.maxLatencySamples)
      .toArray();

    const firstTokenValues: number[] = [];
    const totalValues: number[] = [];

    for (const doc of docs as unknown as LatencySampleRow[]) {
      if (typeof doc.firstTokenMs === 'number') firstTokenValues.push(doc.firstTokenMs);
      if (typeof doc.totalMs === 'number') totalValues.push(doc.totalMs);

      const providerType = typeof doc.providerType === 'string' ? doc.providerType : null;
      const model = typeof doc.model === 'string' ? doc.model : null;
      const providerModel = providerModels.get(providerModelKey(providerType, model));
      if (providerModel && typeof doc.firstTokenMs === 'number') {
        providerModel.firstTokenValues.push(doc.firstTokenMs);
      }
    }

    return { firstTokenValues, totalValues };
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
