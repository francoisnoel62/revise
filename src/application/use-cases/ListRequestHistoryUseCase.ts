// ABOUTME: Use case for listing AI request history for a project
// ABOUTME: Returns paginated list of AIRequestRecords for history browsing

import { AIRequestRepository } from '../../domain/interfaces/AIRequestRepository';
import { AIRequestRecord } from '../../domain/entities/AIRequestRecord';

export interface ListRequestHistoryInput {
  ownerId: string;
  projectId: string;
  limit?: number;
  offset?: number;
}

export class ListRequestHistoryUseCase {
  constructor(private readonly requestRepository: AIRequestRepository) {}

  async execute(input: ListRequestHistoryInput): Promise<AIRequestRecord[]> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    return this.requestRepository.findByProject(input.ownerId, input.projectId, {
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    });
  }
}
