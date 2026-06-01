// ABOUTME: Use case for deleting a recurring writing quota
// ABOUTME: Validates ownership before deletion

import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';

export interface DeleteWritingQuotaInput {
  userId: string;
  quotaId: string;
}

export class DeleteWritingQuotaUseCase {
  constructor(private readonly repository: WritingQuotaRepository) {}

  async execute(input: DeleteWritingQuotaInput): Promise<void> {
    await this.repository.delete(input.userId, input.quotaId);
  }
}
