// ABOUTME: Contract for parsing folders containing multiple document files
// ABOUTME: Each file in the folder becomes a chapter in the project

import { Chapter } from '../entities/Chapter';

/**
 * Represents a file within a folder upload
 */
export interface FolderFile {
  /** Relative path within the folder (e.g., "partie-1/01-intro.md") */
  relativePath: string;
  /** File name (e.g., "01-intro.md") */
  name: string;
  /** File content as Buffer */
  buffer: Buffer;
}

export interface FolderParser {
  /**
   * Check if this parser supports the given folder structure
   * @param files - List of files in the folder
   */
  supports(files: FolderFile[]): boolean;

  /**
   * Parse folder of files into chapters
   * Each file becomes one chapter
   * @param files - List of files with their content
   * @returns Array of chapters ordered by path and filename
   */
  parseToChapters(files: FolderFile[]): Promise<Chapter[]>;
}
