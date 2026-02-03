// ABOUTME: Use case for ignoring an analysis issue
// ABOUTME: Marks issue as ignored and persists to prevent re-flagging

import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';

export interface IgnoreAnalysisIssueInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  analysisId: string;
  issueId: string;
}

export interface IgnoreAnalysisIssueResult {
  success: boolean;
  ignoredText: string;
  category: AnalysisCategory;
}

/**
 * Use case for ignoring an analysis issue.
 *
 * This use case:
 * 1. Validates ownership
 * 2. Finds the analysis and issue
 * 3. Marks the issue as ignored
 * 4. Persists the ignored text to prevent re-flagging
 */
export class IgnoreAnalysisIssueUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: IgnoreAnalysisIssueInput): Promise<IgnoreAnalysisIssueResult> {
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

    // 4. Find analysis
    const analysis = await this.analysisRepository.findAnalysisByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!analysis || analysis.getId() !== input.analysisId) {
      throw new Error('Analysis not found');
    }

    // 5. Find issue
    const issue = analysis.getIssue(input.issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    if (issue.status !== 'pending') {
      throw new Error('Issue has already been resolved');
    }

    // 6. Mark issue as ignored in analysis
    const updatedAnalysis = analysis.ignoreIssue(input.issueId);
    await this.analysisRepository.updateAnalysis(input.ownerId, updatedAnalysis);

    // 7. Persist the ignored text to prevent re-flagging in future analyses
    await this.analysisRepository.saveIgnoredIssue(
      input.ownerId,
      input.chapterId,
      issue.originalText,
      issue.category
    );

    return {
      success: true,
      ignoredText: issue.originalText,
      category: issue.category,
    };
  }

  private validateInput(input: IgnoreAnalysisIssueInput): void {
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

    if (!input.issueId || input.issueId.trim().length === 0) {
      throw new Error('Issue ID is required');
    }
  }
}
