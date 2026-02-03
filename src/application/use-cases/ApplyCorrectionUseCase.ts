// ABOUTME: Use case for applying a single correction to chapter content
// ABOUTME: Updates chapter content and marks the issue as applied in the analysis

import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface ApplyCorrectionInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  analysisId: string;
  issueId: string;
}

export interface ApplyCorrectionResult {
  success: boolean;
  updatedContent: string;
  originalText: string;
  appliedText: string;
}

/**
 * Use case for applying a single correction from an analysis.
 *
 * This use case:
 * 1. Validates ownership
 * 2. Finds the analysis and issue
 * 3. Applies the correction to chapter content
 * 4. Marks the issue as applied
 * 5. Saves the updated chapter
 */
export class ApplyCorrectionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: ApplyCorrectionInput): Promise<ApplyCorrectionResult> {
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

    // 5. Find issue
    const issue = analysis.getIssue(input.issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    if (issue.status !== 'pending') {
      throw new Error('Issue has already been resolved');
    }

    // 6. Apply correction to content
    const originalContent = chapter.getContent();
    const { start, end } = issue.position;

    // Verify the text at the position matches
    const textAtPosition = originalContent.substring(start, end);
    if (textAtPosition !== issue.originalText) {
      throw new Error('Content has changed since analysis - position mismatch');
    }

    const updatedContent =
      originalContent.substring(0, start) +
      issue.suggestion +
      originalContent.substring(end);

    // 7. Update chapter content (mutates chapter in place)
    chapter.updateContent(updatedContent);
    project.touch();
    await this.projectRepository.saveProject(input.ownerId, project);

    // 8. Mark issue as applied in analysis
    const updatedAnalysis = analysis.applyIssue(input.issueId);
    await this.analysisRepository.updateAnalysis(input.ownerId, updatedAnalysis);

    return {
      success: true,
      updatedContent,
      originalText: issue.originalText,
      appliedText: issue.suggestion,
    };
  }

  private validateInput(input: ApplyCorrectionInput): void {
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
