// ABOUTME: Contract for exporting domain entities to various document formats
// ABOUTME: Defines methods for single-chapter, multi-chapter, and legacy exports

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';
import type { PublicationProfile } from '../value-objects/PublicationProfile';

/**
 * Front matter pages data for KDP export (half-title, title page, copyright, dedication, epigraph).
 * All fields are optional — missing content skips that page, except copyrightContent which
 * falls back to a generated placeholder.
 */
export interface FrontMatterData {
  title: string;
  subtitle?: string;
  authorName?: string;
  dedicationContent?: string;
  copyrightContent?: string;
  epigraphContent?: string;
  isbn?: string;
  copyrightYear?: number;
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
   * Front matter pages (half-title, title, copyright, dedication, epigraph).
   * KDP preset only. Ignored for neutral/structured presets.
   */
  frontMatter?: FrontMatterData;
  /**
   * Publication profile for PDF export (page size, margins, fonts).
   * Defaults to KDP 6×9 when not provided.
   */
  publicationProfile?: PublicationProfile;
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
