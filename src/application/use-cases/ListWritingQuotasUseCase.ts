// ABOUTME: Use case for listing recurring writing quotas for a project
// ABOUTME: Returns all quotas sorted by creation date

import { WritingQuota } from '@/domain/entities/WritingQuota';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';

export interface ListWritingQuotasInput {
  userId: string;
  projectId: string;
}

export class ListWritingQuotasUseCase {
  constructor(private readonly repository: WritingQuotaRepository) {}

  async execute(input: ListWritingQuotasInput): Promise<WritingQuota[]> {
    return this.repository.findByProjectId(input.userId, input.projectId);
  }
}
