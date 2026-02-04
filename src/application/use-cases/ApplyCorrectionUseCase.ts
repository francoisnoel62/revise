// ABOUTME: Use case for applying a single correction to chapter content
// ABOUTME: Uses text-based matching instead of fragile position-based approach

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { findTextInContent, applyTextReplacement } from './text-matching';

export interface CorrectionIssue {
  originalText: string;
  suggestion: string;
  context?: string;
  // Position is kept for backwards compatibility but no longer used for matching
  position?: { start: number; end: number };
}

export interface ApplyCorrectionInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  issue: CorrectionIssue;
}

export interface ApplyCorrectionResult {
  success: boolean;
  updatedContent: string;
  originalText: string;
  appliedText: string;
}

/**
 * Use case for applying a single correction to chapter content.
 *
 * This use case:
 * 1. Validates ownership
 * 2. Applies the correction to chapter content
 * 3. Saves the updated chapter
 */
export class ApplyCorrectionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository
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

    const issue = input.issue;

    // 4. Apply correction to content using text-based matching
    const originalContent = chapter.getContent();

    // Find the text to replace using text search (not position)
    const matchResult = findTextInContent(
      originalContent,
      issue.originalText,
      issue.context
    );

    if (!matchResult.found) {
      throw new Error(
        `Text not found in content: "${issue.originalText.substring(0, 50)}${issue.originalText.length > 50 ? '...' : ''}"`
      );
    }

    const updatedContent = applyTextReplacement(
      originalContent,
      matchResult.index,
      issue.originalText,
      issue.suggestion
    );

    // 5. Update chapter content
    chapter.updateContent(updatedContent);
    project.touch();
    await this.projectRepository.updateProject(input.ownerId, project);

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

    if (!input.issue) {
      throw new Error('Issue is required');
    }
  }
}
