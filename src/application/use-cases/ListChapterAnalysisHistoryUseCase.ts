// ABOUTME: Use case for listing chapter analysis history entries
// ABOUTME: Returns paginated history sorted by creation date descending

import { AnalysisHistory } from '../../domain/entities/AnalysisHistory';
import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface ListChapterAnalysisHistoryInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
}

export interface ListChapterAnalysisHistoryResult {
  history: AnalysisHistory[];
  totalCount: number;
}

/**
 * Use case for listing analysis history for a chapter.
 */
export class ListChapterAnalysisHistoryUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: ListChapterAnalysisHistoryInput): Promise<ListChapterAnalysisHistoryResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Verify project ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Verify chapter exists
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // 4. Load history
    const history = await this.analysisRepository.findHistoryByChapterId(
      input.ownerId,
      input.chapterId
    );

    return {
      history,
      totalCount: history.length,
    };
  }

  private validateInput(input: ListChapterAnalysisHistoryInput): void {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }
  }
}
