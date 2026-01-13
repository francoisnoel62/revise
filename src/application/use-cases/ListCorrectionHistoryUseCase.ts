// ABOUTME: Use case for listing correction history entries for a project
// ABOUTME: Validates project ownership before returning history list

import { CorrectionHistory } from '../../domain/entities/CorrectionHistory';
import { CorrectionHistoryRepository } from '../../domain/interfaces/CorrectionHistoryRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface ListCorrectionHistoryInput {
  ownerId: string;
  projectId: string;
}

export interface ListCorrectionHistoryResult {
  history: CorrectionHistory[];
}

export class ListCorrectionHistoryUseCase {
  constructor(
    private readonly historyRepository: CorrectionHistoryRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async execute(input: ListCorrectionHistoryInput): Promise<ListCorrectionHistoryResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // 2. Verify project exists and is owned by user
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Get all history for this project (sorted by createdAt DESC in repository)
    const history = await this.historyRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    return { history };
  }
}
