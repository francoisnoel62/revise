// ABOUTME: Orchestrates fetching model pricing from OpenRouter and persisting to MongoDB.
// ABOUTME: Validates the diff (key collisions, large swings) and quarantines suspect entries before upsert.

import { ModelPricingEntry, ModelPricingRepository } from '@/domain/interfaces/ModelPricingRepository';
import { EmailService, PricingSyncReport } from '@/domain/interfaces/EmailService';
import { PricingClient } from '@/domain/interfaces/PricingClient';
import { MAX_VARIATION_RATIO, exceedsThreshold } from '../utils/pricing-variation';

function formatUsd(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

export class SyncModelPricingUseCase {
  constructor(
    private readonly pricingClient: PricingClient,
    private readonly pricingRepository: ModelPricingRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(): Promise<PricingSyncReport> {
    const report: PricingSyncReport = {
      newModels: [],
      updatedModels: [],
      pendingVariations: [],
      totalModels: 0,
      syncedAt: new Date(),
      errors: [],
    };

    try {
      const [fetched, existing] = await Promise.all([
        this.pricingClient.fetchPricingEntries(),
        this.pricingRepository.findAll(),
      ]);

      const existingMap = new Map<string, ModelPricingEntry>(
        existing.map((e) => [`${e.provider}/${e.prefix}`, e])
      );

      // Group fetched entries by key first. Several distinct source models can
      // collapse onto the same provider/prefix key (e.g. claude-opus-4 and
      // claude-opus-4.8); applying them would be order-dependent (last write
      // wins), so colliding keys are quarantined rather than upserted.
      const byKey = new Map<string, typeof fetched>();
      for (const entry of fetched) {
        const key = `${entry.provider}/${entry.prefix}`;
        const group = byKey.get(key);
        if (group) group.push(entry);
        else byKey.set(key, [entry]);
      }

      const toApply: typeof fetched = [];

      for (const [key, group] of byKey) {
        if (group.length > 1) {
          report.errors.push(
            `Collision de clé "${key}" : ${group.length} modèles sources distincts fusionnés — entrées ignorées (préfixe trop générique).`
          );
          continue;
        }

        const entry = group[0];
        const prev = existingMap.get(key);
        const current = {
          inputPerM: entry.inputPerM,
          outputPerM: entry.outputPerM,
          cachedInputPerM: entry.cachedInputPerM,
        };

        if (!prev) {
          report.newModels.push({
            key,
            provider: entry.provider,
            prefix: entry.prefix,
            previous: null,
            current,
          });
          toApply.push(entry);
          continue;
        }

        const changed =
          prev.inputPerM !== entry.inputPerM ||
          prev.outputPerM !== entry.outputPerM ||
          prev.cachedInputPerM !== entry.cachedInputPerM;

        if (!changed) {
          // Unchanged: re-upsert to refresh updatedAt, but don't report it.
          toApply.push(entry);
          continue;
        }

        if (exceedsThreshold(prev, current)) {
          report.errors.push(
            `Variation > ${MAX_VARIATION_RATIO * 100}% sur "${key}" non appliquée, à valider : ` +
              `entrée ${formatUsd(prev.inputPerM)}→${formatUsd(current.inputPerM)} $, ` +
              `sortie ${formatUsd(prev.outputPerM)}→${formatUsd(current.outputPerM)} $, ` +
              `cache ${formatUsd(prev.cachedInputPerM)}→${formatUsd(current.cachedInputPerM)} $.`
          );
          report.pendingVariations.push({
            key,
            provider: entry.provider,
            prefix: entry.prefix,
            previous: {
              inputPerM: prev.inputPerM,
              outputPerM: prev.outputPerM,
              cachedInputPerM: prev.cachedInputPerM,
            },
            current,
          });
          continue;
        }

        report.updatedModels.push({
          key,
          provider: entry.provider,
          prefix: entry.prefix,
          previous: {
            inputPerM: prev.inputPerM,
            outputPerM: prev.outputPerM,
            cachedInputPerM: prev.cachedInputPerM,
          },
          current,
        });
        toApply.push(entry);
      }

      await this.pricingRepository.upsertMany(toApply);
      report.totalModels = byKey.size;
    } catch (err) {
      report.errors.push(err instanceof Error ? err.message : String(err));
    }

    await this.emailService.sendPricingSyncReport(report).catch((err) => {
      console.error('Failed to send pricing sync report email:', err);
    });

    return report;
  }
}
