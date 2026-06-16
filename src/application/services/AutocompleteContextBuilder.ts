// ABOUTME: Long-range context builder for autocompletion (the writing hot path)
// ABOUTME: Author intent (research) + optional canon facts; the local scene comes from the cursor window

import { CanonFactRepository } from '../../domain/interfaces/CanonFactRepository';
import { AIContextBuilder } from './AIContextBuilder';

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

export interface AutocompleteContextResult {
  /** The context block to prepend to the completion prompt ('' when empty). */
  context: string;
  /** Number of canon facts injected into this context (for instrumentation). */
  canonFactsCount: number;
}

// Hard ceiling on canon facts injected, so the realtime prompt never bloats.
const MAX_CANON_FACTS = 20;

export class AutocompleteContextBuilder {
  constructor(
    private readonly aiContextBuilder: AIContextBuilder,
    private readonly canonFactRepository?: CanonFactRepository
  ) {}

  /**
   * Build the long-range context block to prepend to the completion prompt.
   * The local scene is supplied separately by the cursor window; this adds only
   * what is too far to fit there: author intent (research) → metadata (opt-in) →
   * canon facts (opt-in). Returns the assembled context and how many canon facts it injected.
   */
  async buildContext(
    input: AutocompleteContextInput
  ): Promise<AutocompleteContextResult> {
    const parts: string[] = [];
    let canonFactsCount = 0;

    if (input.includeCanon) {
      const canon = await this.buildCanonSection(input);
      if (canon) {
        parts.push(canon.text);
        canonFactsCount = canon.count;
      }
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

    return {
      context: parts.length > 0 ? '\n\n' + parts.join('\n\n') : '',
      canonFactsCount,
    };
  }

  /**
   * Build the [CANON] section: facts about the locally-present characters that are
   * valid at the current chapter. Returns null if disabled, unavailable or empty.
   */
  private async buildCanonSection(
    input: AutocompleteContextInput
  ): Promise<{ text: string; count: number } | null> {
    if (!this.canonFactRepository) return null;
    if (!input.entities || input.entities.length === 0) return null;
    if (input.chapterIndex === undefined) return null;

    let facts;
    try {
      facts = await this.canonFactRepository.findForSelection(
        input.ownerId,
        input.projectId,
        input.entities,
        input.chapterIndex
      );
    } catch {
      return null; // fail gracefully — completion still works without canon
    }

    if (facts.length === 0) return null;

    const selected = facts.slice(0, MAX_CANON_FACTS);
    const lines = selected.map(
      (f) => `${f.getEntity()} : ${f.getStatement()} (depuis ch.${f.getValidFromChapter() + 1})`
    );

    return { text: `[CANON]\n${lines.join('\n')}`, count: selected.length };
  }
}
