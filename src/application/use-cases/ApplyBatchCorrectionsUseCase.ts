// ABOUTME: Use case for applying multiple corrections at once
// ABOUTME: Handles position offset adjustments when applying sequential corrections

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface BatchCorrectionIssue {
  id: string;
  originalText: string;
  suggestion: string;
  position: { start: number; end: number };
}

export interface ApplyBatchCorrectionsInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  issues: BatchCorrectionIssue[];
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
    private readonly projectRepository: ProjectRepository
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

    // 4. Sort by position descending (apply from end to start to preserve positions)
    const sortedIssues = [...input.issues].sort(
      (a, b) => b.position.start - a.position.start
    );

    // 5. Apply corrections
    let currentContent = chapter.getContent();
    const appliedCorrections: ApplyBatchCorrectionsResult['appliedCorrections'] = [];
    const failedCorrections: ApplyBatchCorrectionsResult['failedCorrections'] = [];

    for (const issue of sortedIssues) {
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

      appliedCorrections.push({
        issueId: issue.id,
        originalText: issue.originalText,
        appliedText: issue.suggestion,
      });
    }

    // 6. Save updated chapter if any corrections were applied
    if (appliedCorrections.length > 0) {
      chapter.updateContent(currentContent);
      project.touch();
      await this.projectRepository.updateProject(input.ownerId, project);
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

    if (!input.issues || input.issues.length === 0) {
      throw new Error('At least one issue is required');
    }
  }
}
