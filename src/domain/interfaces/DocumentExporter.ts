// ABOUTME: Contract for exporting domain entities to various document formats
// ABOUTME: Defines methods for single-chapter, multi-chapter, and legacy exports

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';
import type { PublicationProfile } from '../value-objects/PublicationProfile';
import type { LevelStyleSetProperties } from '../value-objects/LevelStyleSet';

/** A named annex the author inserts manually (front or back matter). */
export interface AnnexEntry {
  title: string;
  /** TipTap doc JSON string (legacy plain text is tolerated). */
  content: string;
}

/**
 * Front matter pages data for KDP export (half-title, title page, copyright, dedication,
 * epigraph, then any front custom annexes). All fields are optional — missing content skips
 * that page. The copyright page is always emitted and auto-generated from year + author.
 */
export interface FrontMatterData {
  title: string;
  subtitle?: string;
  authorName?: string;
  dedicationContent?: string;
  epigraphContent?: string;
  copyrightYear?: number;
  /** Author-inserted annexes rendered as liminaires after the epigraph. */
  customAnnexes?: AnnexEntry[];
}

/**
 * Back matter pages, rendered after the body: author-inserted annexes first, then the legal
 * notice ("mentions légales" + ISBN) on the very last page. All fields optional — an empty
 * BackMatterData produces no pages.
 */
export interface BackMatterData {
  /** "Mentions légales" — rich content (reproduction notice, legal text). */
  legalNoticeContent?: string;
  isbn?: string;
  /** Author-inserted annexes rendered after the body, before the legal notice. */
  customAnnexes?: AnnexEntry[];
}

/**
 * Options for document export
 */
export interface ExportOptions {
  /**
   * URL of the cover image to include as the first page
   * If provided, a cover page will be added before the content
   */
  coverImageUrl?: string;
  /**
   * Front matter pages (half-title, title, copyright, dedication, epigraph, front annexes).
   * KDP preset only. Ignored for neutral/structured presets.
   */
  frontMatter?: FrontMatterData;
  /**
   * Back matter pages (custom annexes, then legal notice on the last page).
   * KDP preset only. Ignored for neutral/structured presets.
   */
  backMatter?: BackMatterData;
  /**
   * Publication profile for PDF export (page size, margins, fonts).
   * Defaults to KDP 6×9 when not provided.
   */
  publicationProfile?: PublicationProfile;
  /** Per-role typography for the selected PDF profile. Ignored by DOCX. */
  levelStyles?: LevelStyleSetProperties;
  /** Heading for the compiled endnotes section (paged PDF). Defaults to « Notes ». */
  endnotesTitle?: string;
}

export interface DocumentExporter {
  /**
   * Check if this exporter supports the given file format
   */
  supports(filename: string): boolean;

  /**
   * Export entire project with all chapters (Phase 2+)
   * Combines chapters with page breaks or section separators
   */
  exportProject(project: Project, filename: string, options?: ExportOptions): Promise<Buffer>;

  /**
   * Export selected chapters
   * Combines chapters with page breaks or section separators
   */
  exportChapters(chapters: Chapter[], filename: string, options?: ExportOptions): Promise<Buffer>;

  /**
   * Export single chapter (Phase 2+)
   */
  exportChapter(chapter: Chapter, filename: string, options?: ExportOptions): Promise<Buffer>;

  /**
   * Export plain text content (Phase 1 - backward compatibility)
   * @deprecated Use exportProject or exportChapter for Phase 2+ features
   */
  export(content: string, filename: string): Promise<Buffer>;
}
