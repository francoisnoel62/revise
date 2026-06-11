// ABOUTME: Orchestrates fetching model pricing from OpenRouter and persisting to MongoDB.
// ABOUTME: Computes a diff (new vs updated) and sends an email report after each sync.

import { ModelPricingEntry, ModelPricingRepository } from '@/domain/interfaces/ModelPricingRepository';
import { EmailService, PricingSyncReport } from '@/domain/interfaces/EmailService';
import { OpenRouterPricingClient } from '@/infrastructure/pricing/OpenRouterPricingClient';

export class SyncModelPricingUseCase {
  constructor(
    private readonly pricingClient: OpenRouterPricingClient,
    private readonly pricingRepository: ModelPricingRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(): Promise<PricingSyncReport> {
    const report: PricingSyncReport = {
      newModels: [],
      updatedModels: [],
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

      for (const entry of fetched) {
        const key = `${entry.provider}/${entry.prefix}`;
        const prev = existingMap.get(key);
        if (!prev) {
          report.newModels.push(key);
        } else if (
          prev.inputPerM !== entry.inputPerM ||
          prev.outputPerM !== entry.outputPerM ||
          prev.cachedInputPerM !== entry.cachedInputPerM
        ) {
          report.updatedModels.push(key);
        }
      }

      await this.pricingRepository.upsertMany(fetched);
      report.totalModels = fetched.length;
    } catch (err) {
      report.errors.push(err instanceof Error ? err.message : String(err));
    }

    await this.emailService.sendPricingSyncReport(report).catch((err) => {
      console.error('Failed to send pricing sync report email:', err);
    });

    return report;
  }
}
