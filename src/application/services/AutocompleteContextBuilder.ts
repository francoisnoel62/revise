// ABOUTME: Manuscript-first context builder for autocompletion (the writing hot path)
// ABOUTME: Real text first (current chapter) + author intent; derived metadata only if opted in

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { AIContextBuilder } from './AIContextBuilder';
import { extractChapterText } from './project-text';

export interface AutocompleteContextInput {
  ownerId: string;
  projectId: string;
  chapterId?: string;
  /** Opt-in: append derived metadata (off by default — metadata out of the hot path). */
  includeMetadata?: boolean;
}

// Tail of the current chapter (chars) included as context — nearest the cursor.
const CHAPTER_TEXT_CAP = 1500;

export class AutocompleteContextBuilder {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly aiContextBuilder: AIContextBuilder
  ) {}

  /**
   * Build a manuscript-first context block to prepend to the completion prompt.
   * Hierarchy: current chapter text → author intent (research) → metadata (opt-in only).
   */
  async buildContext(input: AutocompleteContextInput): Promise<string> {
    const parts: string[] = [];

    const chapterText = await this.currentChapterText(
      input.ownerId,
      input.projectId,
      input.chapterId
    );
    if (chapterText) {
      parts.push(`[CHAPITRE EN COURS]\n${chapterText}`);
    }

    if (input.includeMetadata) {
      // Opt-in path (e.g. A/B variant): derived metadata + author intent.
      const meta = await this.aiContextBuilder.buildCompletionContext(
        input.ownerId,
        input.projectId,
        input.chapterId
      );
      if (meta.trim()) parts.push(meta.trim());
    } else {
      // Default: author intent only — no derived metadata in the hot path.
      const research = await this.aiContextBuilder.buildResearchContext(
        input.ownerId,
        input.projectId,
        input.chapterId
      );
      if (research.trim()) parts.push(research.trim());
    }

    return parts.length > 0 ? '\n\n' + parts.join('\n\n') : '';
  }

  private async currentChapterText(
    ownerId: string,
    projectId: string,
    chapterId?: string
  ): Promise<string> {
    if (!chapterId) return '';

    let project;
    try {
      project = await this.projectRepository.loadProject(ownerId, projectId);
    } catch {
      return ''; // fail gracefully — completion still works without chapter context
    }
    if (!project) return '';

    const chapter = project.getChapters().find((c) => c.getId() === chapterId);
    if (!chapter) return '';

    const text = extractChapterText(chapter).trim();
    if (!text) return '';

    // Keep the tail nearest the cursor when the chapter is long.
    return text.length <= CHAPTER_TEXT_CAP
      ? text
      : '…' + text.slice(text.length - CHAPTER_TEXT_CAP);
  }
}
