// ABOUTME: Use case for retrieving AI request visualization data
// ABOUTME: Loads a single AIRequestRecord for the visualization panel

import { AIRequestRepository } from '../../domain/interfaces/AIRequestRepository';
import { AIRequestRecord } from '../../domain/entities/AIRequestRecord';

export interface GetRequestVisualizationInput {
  ownerId: string;
  requestRecordId: string;
}

export class GetRequestVisualizationUseCase {
  constructor(private readonly requestRepository: AIRequestRepository) {}

  async execute(input: GetRequestVisualizationInput): Promise<AIRequestRecord | null> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!input.requestRecordId || input.requestRecordId.trim().length === 0) {
      throw new Error('Request record ID is required');
    }

    return this.requestRepository.findById(input.ownerId, input.requestRecordId);
  }
}
