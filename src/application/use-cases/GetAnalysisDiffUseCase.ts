// ABOUTME: Use case for generating before/after diff of chapter content
// ABOUTME: Compares history snapshot with current content for side-by-side view

import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface DiffSegment {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

export interface GetAnalysisDiffInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  historyId: string;
}

export interface GetAnalysisDiffResult {
  originalContent: string;
  currentContent: string;
  diff: DiffSegment[];
  changeCount: number;
}

/**
 * Use case for generating a diff between history snapshot and current content.
 *
 * Provides:
 * - Original content from history
 * - Current chapter content
 * - Diff segments for visualization
 * - Count of changes
 */
export class GetAnalysisDiffUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: GetAnalysisDiffInput): Promise<GetAnalysisDiffResult> {
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

    // 4. Find history entry
    const history = await this.analysisRepository.findHistoryById(
      input.ownerId,
      input.historyId
    );

    if (!history) {
      throw new Error('History not found');
    }

    // 5. Generate diff
    const originalContent = history.getOriginalContent();
    const currentContent = chapter.getContent();

    const diff = this.generateDiff(originalContent, currentContent);
    const changeCount = diff.filter((s) => s.type !== 'unchanged').length;

    return {
      originalContent,
      currentContent,
      diff,
      changeCount,
    };
  }

  /**
   * Generate a simple word-level diff between two texts.
   * For production, consider using a proper diff library.
   */
  private generateDiff(original: string, current: string): DiffSegment[] {
    const segments: DiffSegment[] = [];

    // Simple character-by-character diff
    // This is a basic implementation - for production use a proper diff algorithm
    if (original === current) {
      segments.push({ type: 'unchanged', text: original });
      return segments;
    }

    // Find common prefix
    let prefixEnd = 0;
    while (
      prefixEnd < original.length &&
      prefixEnd < current.length &&
      original[prefixEnd] === current[prefixEnd]
    ) {
      prefixEnd++;
    }

    // Find common suffix
    let suffixStart = 0;
    while (
      suffixStart < original.length - prefixEnd &&
      suffixStart < current.length - prefixEnd &&
      original[original.length - 1 - suffixStart] === current[current.length - 1 - suffixStart]
    ) {
      suffixStart++;
    }

    // Add prefix if exists
    if (prefixEnd > 0) {
      segments.push({
        type: 'unchanged',
        text: original.substring(0, prefixEnd),
      });
    }

    // Add removed middle part
    const removedMiddle = original.substring(prefixEnd, original.length - suffixStart);
    if (removedMiddle.length > 0) {
      segments.push({ type: 'removed', text: removedMiddle });
    }

    // Add added middle part
    const addedMiddle = current.substring(prefixEnd, current.length - suffixStart);
    if (addedMiddle.length > 0) {
      segments.push({ type: 'added', text: addedMiddle });
    }

    // Add suffix if exists
    if (suffixStart > 0) {
      segments.push({
        type: 'unchanged',
        text: original.substring(original.length - suffixStart),
      });
    }

    return segments;
  }

  private validateInput(input: GetAnalysisDiffInput): void {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.historyId || input.historyId.trim().length === 0) {
      throw new Error('History ID is required');
    }
  }
}
