// ABOUTME: Use case for applying multiple corrections at once
// ABOUTME: Uses text-based matching for robust sequential corrections

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { findTextInContent, applyTextReplacement } from './text-matching';

export interface BatchCorrectionIssue {
  id: string;
  originalText: string;
  suggestion: string;
  context?: string;
  // Position is kept for backwards compatibility but no longer used for matching
  position?: { start: number; end: number };
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
 * Uses text-based matching to find and replace text, which is more robust
 * than position-based matching. Each correction is applied sequentially
 * and the content is updated for the next correction.
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

    // 4. Apply corrections using text-based matching
    // No sorting needed - each correction updates the content for the next one
    let currentContent = chapter.getContent();
    const appliedCorrections: ApplyBatchCorrectionsResult['appliedCorrections'] = [];
    const failedCorrections: ApplyBatchCorrectionsResult['failedCorrections'] = [];

    for (const issue of input.issues) {
      // Find the text using text-based search
      const matchResult = findTextInContent(
        currentContent,
        issue.originalText,
        issue.context
      );

      if (!matchResult.found) {
        failedCorrections.push({
          issueId: issue.id,
          reason: `Text not found: "${issue.originalText.substring(0, 30)}${issue.originalText.length > 30 ? '...' : ''}"`,
        });
        continue;
      }

      // Apply correction
      currentContent = applyTextReplacement(
        currentContent,
        matchResult.index,
        issue.originalText,
        issue.suggestion
      );

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
