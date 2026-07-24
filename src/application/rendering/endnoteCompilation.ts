// ABOUTME: Extracts a chapter's endnotes from its TipTap JSON, in document reading order.
// ABOUTME: The single source of truth for per-chapter numbering shared by the paged and DOCX exports.

import type { JSONContent } from '@tiptap/core';
import type { EndnoteCompilation, EndnoteCompilationChapter } from '@/application/interfaces/PagedRenderer';

// The inline atom node inserted by the EndnoteRef editor extension. Kept as a local literal so
// this server-side utility never imports the client TipTap extension (and its browser deps).
const ENDNOTE_REF_NODE = 'endnoteRef';

/** DOM id of the compiled notes section, used as its table-of-contents link target. */
export const ENDNOTES_SECTION_ID = 'endnotes-section';

/** Section heading shown by default; the author may override it in the publication settings. */
export const DEFAULT_ENDNOTES_TITLE = 'Notes';

export interface ExtractedEndnote {
  /** 1-based number in document order, restarting at 1 for each chapter. */
  readonly number: number;
  /** The rich note body (a one-paragraph TipTap doc), or null for an empty note. */
  readonly content: JSONContent | null;
}

/**
 * Walk a chapter document depth-first and collect every endnote call in reading order.
 * The i-th call becomes number i+1 — the same order the TipTap→HTML converter renders the
 * body superscripts in, so the compiled notes and the body calls always line up.
 */
export function extractChapterEndnotes(doc: JSONContent): ExtractedEndnote[] {
  const found: ExtractedEndnote[] = [];

  const walk = (node: JSONContent): void => {
    if (node.type === ENDNOTE_REF_NODE) {
      found.push({
        number: found.length + 1,
        content: (node.attrs?.content as JSONContent | null | undefined) ?? null,
      });
      return; // an endnote call is an atom: nothing meaningful nests inside it
    }
    for (const child of node.content ?? []) walk(child);
  };

  walk(doc);
  return found;
}

/**
 * Assemble the whole-book endnote compilation from ordered chapters, or undefined when no chapter
 * carries a note. The chapters pass through unchanged (the renderer extracts each one's notes when
 * building the HTML); this only decides whether a Notes section exists and stamps the section title.
 */
export function buildEndnoteCompilation(
  chapters: readonly EndnoteCompilationChapter[],
  title: string,
): EndnoteCompilation | undefined {
  const hasAny = chapters.some((chapter) => extractChapterEndnotes(chapter.content).length > 0);
  return hasAny ? { title, chapters } : undefined;
}

/** DOM id of a body call, used as the round-trip link target from its compiled note. */
export function endnoteCallId(anchorPrefix: string, number: number): string {
  return `endnote-call-${anchorPrefix}-${number}`;
}

/** DOM id of a compiled note, used as the round-trip link target from its body call. */
export function endnoteNoteId(anchorPrefix: string, number: number): string {
  return `endnote-note-${anchorPrefix}-${number}`;
}
