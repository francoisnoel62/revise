// ABOUTME: Contract for exporting domain entities to various document formats
// ABOUTME: Defines methods for single-chapter, multi-chapter, and legacy exports

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';

/**
 * Visual rendering preset for DOCX export.
 * - 'kdp': Amazon KDP print format (6"×9", Garamond 11pt, mirrored margins, ODD_PAGE chapter breaks)
 * - 'neutral': Same structure as 'structured' but heading colors forced to black
 * - 'structured': Native LibreOffice/Word styles (default theme colors applied by the reader)
 */
export type DocxStylePreset = 'kdp' | 'neutral' | 'structured';

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
   * Visual rendering preset for DOCX export. Defaults to 'kdp'.
   */
  stylePreset?: DocxStylePreset;
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
