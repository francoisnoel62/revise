// ABOUTME: Application seam for producing a complete paged-media HTML document.
// ABOUTME: Keeps preview and PDF export on the same rendered-document contract.

import type { JSONContent } from '@tiptap/core';
import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { BackMatterData, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocStyle } from '@/domain/value-objects/TocPreferences';

/** A chapter's data needed to compile its endnotes at the end of the book. */
export interface EndnoteCompilationChapter {
  /** The chapter body's anchor id (e.g. 'chapter-<id>') — the prefix for its notes' round-trip ids. */
  readonly anchorId: string;
  /** The chapter title, used as the group header (falls back to "Chapitre N" when empty). */
  readonly title: string;
  /** The same (semantic) TipTap doc the body was rendered from, so numbering lines up. */
  readonly content: JSONContent;
  /** 1-based chapter position, used only for the "Chapitre N" fallback header. */
  readonly index: number;
}

/** The whole-book endnote compilation: a section title plus each chapter's data. */
export interface EndnoteCompilation {
  readonly title: string;
  readonly chapters: readonly EndnoteCompilationChapter[];
}

/** A sous-titre entry nested under its chapter's TOC entry. */
export interface TocSubEntry {
  readonly title: string;
  readonly anchorId: string;
}

export interface TocEntry {
  readonly title: string;
  readonly chapterId: string;
  readonly subEntries?: readonly TocSubEntry[];
}

export interface PagedRenderRequest {
  readonly bodyHtml: string;
  readonly profile: PublicationProfile;
  readonly assetBaseUrl: string;
  readonly frontMatter?: FrontMatterData;
  /** Back matter (custom annexes then legal notice), rendered after the body. */
  readonly backMatter?: BackMatterData;
  readonly toc?: TocEntry[];
  /** TOC design; defaults to 'classique' (the historical rendering). */
  readonly tocStyle?: TocStyle;
  /** Endnotes compiled into a back-matter section after the body. Absent when the book has none. */
  readonly endnotes?: EndnoteCompilation;
  /** First Arabic page number for this render (default 1). Used for single-chapter previews. */
  readonly startPageNumber?: number;
  /** Opaque identifier echoed back in the paged-rendered postMessage for routing. */
  readonly sourceId?: string;
  /** Typography overrides for the rendered PDF profile. */
  readonly levelStyles?: LevelStyleSetProperties;
  /**
   * Whether the author's blank lines occupy a line on the page. Resolved per project by
   * honorsBlankLines (see BlankLinePolicy); defaults to false so a book never reflows by omission.
   */
  readonly honorBlankLines?: boolean;
}

export interface PagedRenderer {
  render(request: PagedRenderRequest): string;
}
