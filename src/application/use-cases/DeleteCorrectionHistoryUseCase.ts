// ABOUTME: Use case for deleting a correction history entry
// ABOUTME: Validates existence before deletion with ownership verification

import { CorrectionHistoryRepository } from '../../domain/interfaces/CorrectionHistoryRepository';

export interface DeleteCorrectionHistoryInput {
  ownerId: string;
  historyId: string;
}

export class DeleteCorrectionHistoryUseCase {
  constructor(
    private readonly historyRepository: CorrectionHistoryRepository
  ) {}

  async execute(input: DeleteCorrectionHistoryInput): Promise<void> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.historyId || input.historyId.trim().length === 0) {
      throw new Error('History ID is required');
    }

    // 2. Verify history entry exists (ownership is checked via ownerId in findById)
    const history = await this.historyRepository.findById(
      input.ownerId,
      input.historyId
    );

    if (!history) {
      throw new Error('Correction history not found');
    }

    // 3. Delete the entry
    await this.historyRepository.delete(input.ownerId, input.historyId);
  }
}
