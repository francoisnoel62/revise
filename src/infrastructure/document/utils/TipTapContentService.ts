// ABOUTME: Implements ContentConverter for TipTap JSON format
// ABOUTME: Bridges domain layer with TipTap-specific formatting details

import { ContentConverter, ChapterGenerationTypeKey } from '@/domain';
import { extractTextFromTipTapJSON } from './tiptap-conversion';

/**
 * Converts between TipTap JSON format and plain text.
 * Implements the domain ContentConverter interface to keep
 * editor-specific details in the Infrastructure layer.
 */
export class TipTapContentService implements ContentConverter {
  /**
   * Extract plain text from TipTap JSON content.
   */
  extractText(content: string): string {
    if (!content || content.trim().length === 0) {
      return '';
    }

    try {
      const json = JSON.parse(content);
      return extractTextFromTipTapJSON(json);
    } catch {
      // If not valid JSON, return as-is (might be plain text)
      return content;
    }
  }

  /**
   * Convert plain text to TipTap JSON document.
   * Formats differently based on generation type:
   * - chapter-outline: Each line becomes a paragraph
   * - chapter-beginning/chapter-full: Double newlines split paragraphs
   */
  toEditorContent(text: string, generationType: ChapterGenerationTypeKey): string {
    const content: object[] = [];

    if (generationType === 'chapter-outline') {
      // Format outline as structured list (each line = paragraph)
      const lines = text.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        content.push(this.createParagraph(line));
      }
    } else {
      // Format narrative text as paragraphs (double newline = paragraph break)
      const paragraphs = text.split('\n\n').filter((p) => p.trim());
      for (const paragraph of paragraphs) {
        content.push(this.createParagraph(paragraph.trim()));
      }
    }

    // Ensure we have at least one paragraph
    if (content.length === 0) {
      content.push(this.createParagraph(text));
    }

    const doc = {
      type: 'doc',
      content,
    };

    return JSON.stringify(doc);
  }

  /**
   * Create a TipTap paragraph node.
   */
  private createParagraph(text: string): object {
    return {
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    };
  }
}
