// ABOUTME: Manuscript-first context builder for autocompletion (the writing hot path)
// ABOUTME: Real text first (current chapter) + author intent; derived metadata only if opted in

import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { CanonFactRepository } from '../../domain/interfaces/CanonFactRepository';
import { AIContextBuilder } from './AIContextBuilder';
import { extractChapterText } from './project-text';

export interface AutocompleteContextInput {
  ownerId: string;
  projectId: string;
  chapterId?: string;
  /** Opt-in: append derived metadata (off by default — metadata out of the hot path). */
  includeMetadata?: boolean;
  /** Opt-in: append the local canon facts (off by default). */
  includeCanon?: boolean;
  /** Known character names detected in the local window (for canon selection). */
  entities?: string[];
  /** 0-based index of the current chapter (for temporal canon selection). */
  chapterIndex?: number;
}

// Tail of the current chapter (chars) included as context — nearest the cursor.
const CHAPTER_TEXT_CAP = 1500;

// Hard ceiling on canon facts injected, so the realtime prompt never bloats.
const MAX_CANON_FACTS = 20;

export class AutocompleteContextBuilder {
  // Number of canon facts injected by the last buildContext call (for instrumentation).
  private lastCanonFactsCount = 0;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly aiContextBuilder: AIContextBuilder,
    private readonly canonFactRepository?: CanonFactRepository
  ) {}

  /** Canon facts injected by the most recent buildContext call. */
  getLastCanonFactsCount(): number {
    return this.lastCanonFactsCount;
  }

  /**
   * Build a manuscript-first context block to prepend to the completion prompt.
   * Hierarchy: current chapter text → author intent (research) → metadata (opt-in only).
   */
  async buildContext(input: AutocompleteContextInput): Promise<string> {
    const parts: string[] = [];
    this.lastCanonFactsCount = 0;

    const chapterText = await this.currentChapterText(
      input.ownerId,
      input.projectId,
      input.chapterId
    );
    if (chapterText) {
      parts.push(`[CHAPITRE EN COURS]\n${chapterText}`);
    }

    if (input.includeCanon) {
      const canon = await this.buildCanonSection(input);
      if (canon) parts.push(canon);
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

  /**
   * Build the [CANON] section: facts about the locally-present characters that are
   * valid at the current chapter. Returns '' if disabled, unavailable or empty.
   */
  private async buildCanonSection(input: AutocompleteContextInput): Promise<string> {
    if (!this.canonFactRepository) return '';
    if (!input.entities || input.entities.length === 0) return '';
    if (input.chapterIndex === undefined) return '';

    let facts;
    try {
      facts = await this.canonFactRepository.findForSelection(
        input.ownerId,
        input.projectId,
        input.entities,
        input.chapterIndex
      );
    } catch {
      return ''; // fail gracefully — completion still works without canon
    }

    if (facts.length === 0) return '';

    const selected = facts.slice(0, MAX_CANON_FACTS);
    this.lastCanonFactsCount = selected.length;
    const lines = selected.map(
      (f) => `${f.getEntity()} : ${f.getStatement()} (depuis ch.${f.getValidFromChapter() + 1})`
    );

    return `[CANON]\n${lines.join('\n')}`;
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
