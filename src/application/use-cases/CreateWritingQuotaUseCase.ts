// ABOUTME: Use case for creating a recurring writing quota
// ABOUTME: Validates input and delegates to repository

import { WritingQuota, QuotaPeriod } from '@/domain/entities/WritingQuota';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateWritingQuotaInput {
  userId: string;
  projectId: string;
  period: QuotaPeriod;
  targetWords: number;
}

export class CreateWritingQuotaUseCase {
  constructor(
    private readonly repository: WritingQuotaRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateWritingQuotaInput): Promise<WritingQuota> {
    const quota = WritingQuota.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.period,
      input.targetWords
    );

    return this.repository.create(input.userId, quota);
  }
}
