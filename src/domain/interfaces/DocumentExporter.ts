// ABOUTME: Contract for exporting domain entities to various document formats
// ABOUTME: Defines methods for single-chapter, multi-chapter, and legacy exports

import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';

export interface DocumentExporter {
  /**
   * Check if this exporter supports the given file format
   */
  supports(filename: string): boolean;

  /**
   * Export entire project with all chapters (Phase 2+)
   * Combines chapters with page breaks or section separators
   */
  exportProject(project: Project, filename: string): Promise<Buffer>;

  /**
   * Export single chapter (Phase 2+)
   */
  exportChapter(chapter: Chapter, filename: string): Promise<Buffer>;

  /**
   * Export plain text content (Phase 1 - backward compatibility)
   * @deprecated Use exportProject or exportChapter for Phase 2+ features
   */
  export(content: string, filename: string): Promise<Buffer>;
}
