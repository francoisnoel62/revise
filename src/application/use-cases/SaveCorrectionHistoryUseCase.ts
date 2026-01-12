// ABOUTME: Use case for saving a correction history entry
// ABOUTME: Validates ownership and creates new history record after AI rewrite

import { CorrectionHistory } from '../../domain/entities/CorrectionHistory';
import { CorrectionHistoryRepository } from '../../domain/interfaces/CorrectionHistoryRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';

export interface SaveCorrectionHistoryInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  selectedText: string;
  proposals: string[];
}

export interface SaveCorrectionHistoryResult {
  history: CorrectionHistory;
}

export class SaveCorrectionHistoryUseCase {
  constructor(
    private readonly historyRepository: CorrectionHistoryRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: SaveCorrectionHistoryInput): Promise<SaveCorrectionHistoryResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.selectedText || input.selectedText.trim().length === 0) {
      throw new Error('Selected text is required');
    }

    if (!input.proposals || input.proposals.length === 0) {
      throw new Error('At least one proposal is required');
    }

    // 2. Verify project exists and is owned by user
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Verify chapter exists in project
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found in project');
    }

    // 4. Create the correction history entity
    const historyId = this.idGenerator.generate();
    const history = new CorrectionHistory(
      historyId,
      input.projectId,
      input.chapterId,
      input.selectedText,
      input.proposals
    );

    // 5. Save to repository
    await this.historyRepository.save(input.ownerId, history);

    return { history };
  }
}
