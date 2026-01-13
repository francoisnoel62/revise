// ABOUTME: Interface for converting between editor content formats and plain text
// ABOUTME: Abstracts away TipTap/editor-specific details from the application layer

import { ChapterGenerationTypeKey } from '../value-objects/ChapterGenerationType';

/**
 * Converts between editor content format (e.g., TipTap JSON) and plain text.
 * This abstraction allows use cases to work with text without knowing
 * about the specific editor format.
 */
export interface ContentConverter {
  /**
   * Extract plain text from editor content format.
   * @param content The editor content (e.g., TipTap JSON string)
   * @returns Plain text extracted from the content
   */
  extractText(content: string): string;

  /**
   * Convert plain text to editor content format.
   * @param text Plain text to convert
   * @param generationType Type of generation (affects formatting)
   * @returns Editor content (e.g., TipTap JSON string)
   */
  toEditorContent(text: string, generationType: ChapterGenerationTypeKey): string;
}
