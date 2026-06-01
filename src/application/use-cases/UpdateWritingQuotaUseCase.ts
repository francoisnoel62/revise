// ABOUTME: Use case for updating a recurring writing quota
// ABOUTME: Supports updating target words and period

import { WritingQuota, QuotaPeriod } from '@/domain/entities/WritingQuota';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';

export interface UpdateWritingQuotaInput {
  userId: string;
  quotaId: string;
  targetWords?: number;
  period?: QuotaPeriod;
}

export class UpdateWritingQuotaUseCase {
  constructor(private readonly repository: WritingQuotaRepository) {}

  async execute(input: UpdateWritingQuotaInput): Promise<WritingQuota> {
    const existing = await this.repository.findById(input.userId, input.quotaId);

    if (!existing) {
      throw new Error('Quota not found');
    }

    let updated = existing;

    if (input.targetWords !== undefined) {
      updated = updated.updateTarget(input.targetWords);
    }

    if (input.period !== undefined) {
      updated = updated.updatePeriod(input.period);
    }

    return this.repository.update(input.userId, updated);
  }
}
