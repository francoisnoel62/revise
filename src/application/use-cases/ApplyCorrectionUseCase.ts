// ABOUTME: Use case for applying a single correction to chapter content
// ABOUTME: Updates chapter content with the provided correction (in-memory analysis)

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface CorrectionIssue {
  originalText: string;
  suggestion: string;
  position: { start: number; end: number };
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

    // 4. Apply correction to content
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
