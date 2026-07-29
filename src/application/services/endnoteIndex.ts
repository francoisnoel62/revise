// ABOUTME: Groups a project's endnotes by chapter, numbered as at export (rank, 1-based per chapter).
// ABOUTME: Feeds the endnotes manager panel; addresses a note by (chapter, rank), never by a document position.

import type { JSONContent } from '@tiptap/core';
import { extractChapterEndnotes } from '@/application/rendering/endnoteCompilation';

const DEFAULT_PREVIEW_LENGTH = 120;
const PREVIEW_ELLIPSIS = '…';

export interface EndnoteIndexNote {
  /** 1-based rank in reading order, restarting at 1 for each chapter — the note's address. */
  readonly rank: number;
  /** Full note text, normalized whitespace, never truncated. */
  readonly text: string;
  /** Text truncated to a bounded length for display. */
  readonly preview: string;
  /** True when the note has no meaningful text (absent or entirely blank body). */
  readonly isEmpty: boolean;
}

export interface EndnoteIndexChapter {
  readonly chapterId: string;
  readonly chapterTitle: string;
  readonly notes: readonly EndnoteIndexNote[];
}

export interface BuildEndnoteIndexInput {
  readonly chapters: readonly { id: string; title: string; content: string }[];
  readonly activeChapterId: string | null;
  /** In-progress editor content for the active chapter, taking precedence over its stored content. */
  readonly activeContent: string | null;
  readonly previewLength?: number;
}

/**
 * Builds the project's endnote index: one entry per chapter that carries at least one note,
 * in project order, each note numbered as it will be at export. Chapters without a note are
 * omitted; unreadable chapter content contributes no note rather than throwing.
 */
export function buildEndnoteIndex(input: BuildEndnoteIndexInput): EndnoteIndexChapter[] {
  const previewLength = input.previewLength ?? DEFAULT_PREVIEW_LENGTH;
  const result: EndnoteIndexChapter[] = [];

  for (const chapter of input.chapters) {
    const raw =
      chapter.id === input.activeChapterId && input.activeContent !== null
        ? input.activeContent
        : chapter.content;

    const doc = parseChapterDoc(raw);
    if (!doc) continue;

    const extracted = extractChapterEndnotes(doc);
    if (extracted.length === 0) continue;

    const notes = extracted.map((endnote) => buildNote(endnote.number, endnote.content, previewLength));
    result.push({ chapterId: chapter.id, chapterTitle: chapter.title, notes });
  }

  return result;
}

function parseChapterDoc(raw: string): JSONContent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as JSONContent) : null;
  } catch {
    return null;
  }
}

function buildNote(rank: number, content: JSONContent | null, previewLength: number): EndnoteIndexNote {
  const text = content ? normalizeWhitespace(extractText(content)) : '';
  return {
    rank,
    text,
    preview: truncate(text, previewLength),
    isEmpty: text === '',
  };
}

// Concatenates adjacent text runs directly (no separator) so a run split by a mark
// (bold, italic) never gains a phantom space that wasn't in the author's text.
function extractText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(extractText).join('');
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}${PREVIEW_ELLIPSIS}`;
}
