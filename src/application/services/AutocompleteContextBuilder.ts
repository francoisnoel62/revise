// ABOUTME: Long-range context builder for autocompletion (the writing hot path)
// ABOUTME: Canon facts only; the local scene comes from the cursor window

import { CanonFactRepository } from '../../domain/interfaces/CanonFactRepository';

export interface AutocompleteContextInput {
  ownerId: string;
  projectId: string;
  /** Opt-in: append the local canon facts. */
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
const MAX_CANON_FACTS = 40;

export class AutocompleteContextBuilder {
  constructor(private readonly canonFactRepository?: CanonFactRepository) {}

  async buildContext(input: AutocompleteContextInput): Promise<AutocompleteContextResult> {
    const parts: string[] = [];
    let canonFactsCount = 0;

    if (input.includeCanon) {
      const canon = await this.buildCanonSection(input);
      if (canon) {
        parts.push(canon.text);
        canonFactsCount = canon.count;
      }
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

    const prioritized = [...facts].sort((a, b) => {
      // Most recent chapter first
      const chapterDiff = b.getValidFromChapter() - a.getValidFromChapter();
      if (chapterDiff !== 0) return chapterDiff;
      // Within same chapter: categories 2-4 (knowledge/belief) before 1 (objective) and 5 (relational)
      const catA = a.getCategory?.() ?? 1;
      const catB = b.getCategory?.() ?? 1;
      const priorityA = catA >= 2 && catA <= 4 ? 0 : 1;
      const priorityB = catB >= 2 && catB <= 4 ? 0 : 1;
      return priorityA - priorityB;
    });

    const selected = prioritized.slice(0, MAX_CANON_FACTS);
    const lines = selected.map(
      (f) => `${f.getEntity()} : ${f.getStatement()} (depuis ch.${f.getValidFromChapter() + 1})`
    );

    return { text: `[CANON]\n${lines.join('\n')}`, count: selected.length };
  }
}
