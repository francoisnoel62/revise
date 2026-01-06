// ABOUTME: Contract for parsing documents from various formats into domain entities
// ABOUTME: Defines methods for both single-document and multi-chapter parsing

import { Chapter } from '../entities/Chapter';

export interface DocumentParser {
  /**
   * Check if this parser supports the given file format
   */
  supports(filename: string): boolean;

  /**
   * Parse document into multiple chapters (Phase 2+)
   * Splits document by headings (H1) or other logical boundaries
   */
  parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]>;

  /**
   * Parse document into plain text (Phase 1 - backward compatibility)
   * @deprecated Use parseToChapters for Phase 2+ features
   */
  parse(buffer: Buffer, filename: string): Promise<string>;
}
