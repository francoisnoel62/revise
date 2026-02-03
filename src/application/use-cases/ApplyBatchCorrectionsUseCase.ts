// ABOUTME: Use case for applying multiple corrections at once
// ABOUTME: Handles position offset adjustments when applying sequential corrections

import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';

export interface BatchCorrectionItem {
  issueId: string;
}

export interface ApplyBatchCorrectionsInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  analysisId: string;
  corrections: BatchCorrectionItem[];
  /** Optional: only apply corrections from this category */
  category?: AnalysisCategory;
}

export interface ApplyBatchCorrectionsResult {
  success: boolean;
  appliedCount: number;
  failedCount: number;
  updatedContent: string;
  appliedCorrections: Array<{
    issueId: string;
    originalText: string;
    appliedText: string;
  }>;
  failedCorrections: Array<{
    issueId: string;
    reason: string;
  }>;
}

/**
 * Use case for applying multiple corrections at once.
 *
 * This use case handles the complexity of applying multiple corrections
 * to the same text by sorting issues by position (descending) to avoid
 * position offset issues.
 */
export class ApplyBatchCorrectionsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: ApplyBatchCorrectionsInput): Promise<ApplyBatchCorrectionsResult> {
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
    let analysis = await this.analysisRepository.findAnalysisByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!analysis || analysis.getId() !== input.analysisId) {
      throw new Error('Analysis not found');
    }

    // 5. Get issues to apply
    let issuesToApply = input.corrections
      .map((c) => analysis!.getIssue(c.issueId))
      .filter((issue) => issue !== undefined);

    // Filter by category if specified
    if (input.category) {
      issuesToApply = issuesToApply.filter((issue) => issue!.category === input.category);
    }

    // Filter out already resolved issues
    issuesToApply = issuesToApply.filter((issue) => issue!.status === 'pending');

    // 6. Sort by position descending (apply from end to start to preserve positions)
    issuesToApply.sort((a, b) => b!.position.start - a!.position.start);

    // 7. Apply corrections
    let currentContent = chapter.getContent();
    const appliedCorrections: ApplyBatchCorrectionsResult['appliedCorrections'] = [];
    const failedCorrections: ApplyBatchCorrectionsResult['failedCorrections'] = [];

    for (const issue of issuesToApply) {
      if (!issue) continue;

      const { start, end } = issue.position;
      const textAtPosition = currentContent.substring(start, end);

      // Verify position still matches
      if (textAtPosition !== issue.originalText) {
        failedCorrections.push({
          issueId: issue.id,
          reason: 'Position mismatch - content may have changed',
        });
        continue;
      }

      // Apply correction
      currentContent =
        currentContent.substring(0, start) +
        issue.suggestion +
        currentContent.substring(end);

      // Mark as applied
      analysis = analysis.applyIssue(issue.id);

      appliedCorrections.push({
        issueId: issue.id,
        originalText: issue.originalText,
        appliedText: issue.suggestion,
      });
    }

    // 8. Save updated chapter if any corrections were applied
    if (appliedCorrections.length > 0) {
      chapter.updateContent(currentContent);
      project.touch();
      await this.projectRepository.updateProject(input.ownerId, project);
      await this.analysisRepository.updateAnalysis(input.ownerId, analysis);
    }

    return {
      success: failedCorrections.length === 0,
      appliedCount: appliedCorrections.length,
      failedCount: failedCorrections.length,
      updatedContent: currentContent,
      appliedCorrections,
      failedCorrections,
    };
  }

  private validateInput(input: ApplyBatchCorrectionsInput): void {
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

    if (!input.corrections || input.corrections.length === 0) {
      throw new Error('At least one correction is required');
    }
  }
}
