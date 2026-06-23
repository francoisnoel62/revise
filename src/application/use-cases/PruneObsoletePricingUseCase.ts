// ABOUTME: Deletes stored pricing entries whose provider/prefix is absent from the latest OpenRouter fetch.
// ABOUTME: Safe by design — a failed fetch deletes nothing (errors are reported instead).

import { ModelPricingRepository } from '@/domain/interfaces/ModelPricingRepository';
import { PricingClient } from '@/domain/interfaces/PricingClient';

export interface PrunePricingReport {
  /** "provider/prefix" keys that were deleted. */
  deletedKeys: string[];
  /** Number of stored entries examined. */
  checked: number;
  errors: string[];
}

export class PruneObsoletePricingUseCase {
  constructor(
    private readonly pricingClient: PricingClient,
    private readonly pricingRepository: ModelPricingRepository
  ) {}

  async execute(): Promise<PrunePricingReport> {
    const report: PrunePricingReport = { deletedKeys: [], checked: 0, errors: [] };

    try {
      // Fetch first: if the upstream catalog is unavailable, throw before any
      // delete so a transient network error can never wipe the table.
      const [fetched, existing] = await Promise.all([
        this.pricingClient.fetchPricingEntries(),
        this.pricingRepository.findAll(),
      ]);

      const currentKeys = new Set(fetched.map((e) => `${e.provider}/${e.prefix}`));
      report.checked = existing.length;

      const obsolete = existing.filter(
        (e) => !currentKeys.has(`${e.provider}/${e.prefix}`)
      );

      for (const entry of obsolete) {
        await this.pricingRepository.delete(entry.id);
        report.deletedKeys.push(`${entry.provider}/${entry.prefix}`);
      }
    } catch (err) {
      report.errors.push(err instanceof Error ? err.message : String(err));
    }

    return report;
  }
}
