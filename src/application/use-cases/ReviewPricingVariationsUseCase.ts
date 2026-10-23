// ABOUTME: Lists and applies the price swings the daily sync held back for manual validation.
// ABOUTME: Recomputes them from a fresh OpenRouter fetch, so the admin always validates current prices.

import { ModelPricingEntry, ModelPricingRepository } from '@/domain/interfaces/ModelPricingRepository';
import { ModelPriceChange } from '@/domain/interfaces/EmailService';
import { PricingClient } from '@/domain/interfaces/PricingClient';
import { exceedsThreshold } from '../utils/pricing-variation';

export interface ApplyVariationsReport {
  /** "provider/prefix" keys that were written to the database. */
  appliedKeys: string[];
}

interface PendingVariation {
  change: ModelPriceChange;
  entry: Omit<ModelPricingEntry, 'id'>;
}

export class ReviewPricingVariationsUseCase {
  constructor(
    private readonly pricingClient: PricingClient,
    private readonly pricingRepository: ModelPricingRepository
  ) {}

  async listPending(): Promise<ModelPriceChange[]> {
    return (await this.findPending()).map((p) => p.change);
  }

  /** Applies the given pending keys, or every pending swing when `keys` is omitted. */
  async apply(keys?: string[]): Promise<ApplyVariationsReport> {
    const wanted = keys ? new Set(keys) : null;
    const selected = (await this.findPending()).filter((p) => !wanted || wanted.has(p.change.key));

    if (selected.length === 0) return { appliedKeys: [] };

    await this.pricingRepository.upsertMany(selected.map((p) => p.entry));
    return { appliedKeys: selected.map((p) => p.change.key) };
  }

  private async findPending(): Promise<PendingVariation[]> {
    const [fetched, existing] = await Promise.all([
      this.pricingClient.fetchPricingEntries(),
      this.pricingRepository.findAll(),
    ]);

    const existingMap = new Map(existing.map((e) => [`${e.provider}/${e.prefix}`, e]));

    // Same grouping as the sync: a key shared by several source models is ambiguous and never applied.
    const byKey = new Map<string, typeof fetched>();
    for (const entry of fetched) {
      const key = `${entry.provider}/${entry.prefix}`;
      const group = byKey.get(key);
      if (group) group.push(entry);
      else byKey.set(key, [entry]);
    }

    const pending: PendingVariation[] = [];
    for (const [key, group] of byKey) {
      if (group.length > 1) continue;
      const entry = group[0];
      const prev = existingMap.get(key);
      if (!prev) continue;

      const current = {
        inputPerM: entry.inputPerM,
        outputPerM: entry.outputPerM,
        cachedInputPerM: entry.cachedInputPerM,
      };
      if (!exceedsThreshold(prev, current)) continue;

      pending.push({
        change: {
          key,
          provider: entry.provider,
          prefix: entry.prefix,
          previous: {
            inputPerM: prev.inputPerM,
            outputPerM: prev.outputPerM,
            cachedInputPerM: prev.cachedInputPerM,
          },
          current,
        },
        entry,
      });
    }
    return pending;
  }
}
