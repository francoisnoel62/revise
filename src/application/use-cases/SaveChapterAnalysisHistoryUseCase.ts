// ABOUTME: Use case for saving chapter analysis history
// ABOUTME: Creates a snapshot of analysis state for before/after comparison

import { AnalysisHistory } from '../../domain/entities/AnalysisHistory';
import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';

export interface SaveChapterAnalysisHistoryInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  analysisId: string;
}

export interface SaveChapterAnalysisHistoryResult {
  history: AnalysisHistory;
}

/**
 * Use case for saving analysis history.
 *
 * Creates a snapshot of the current analysis state including:
 * - Original content at time of analysis
 * - Total issues found
 * - Categories analyzed
 *
 * This allows for before/after comparison.
 */
export class SaveChapterAnalysisHistoryUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: SaveChapterAnalysisHistoryInput): Promise<SaveChapterAnalysisHistoryResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Load project and verify ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Find chapter
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // 4. Find analysis
    const analysis = await this.analysisRepository.findAnalysisByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!analysis || analysis.getId() !== input.analysisId) {
      throw new Error('Analysis not found');
    }

    // 5. Create history entry
    const history = new AnalysisHistory({
      id: this.idGenerator.generate(),
      chapterId: input.chapterId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      originalContent: chapter.getContent(),
      totalIssuesFound: analysis.getTotalIssueCount(),
      categoriesAnalyzed: analysis.getCategories() as AnalysisCategory[],
    });

    // 6. Save history
    await this.analysisRepository.saveHistory(input.ownerId, history);

    return { history };
  }

  private validateInput(input: SaveChapterAnalysisHistoryInput): void {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.analysisId || input.analysisId.trim().length === 0) {
      throw new Error('Analysis ID is required');
    }
  }
}
