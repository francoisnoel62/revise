// ABOUTME: PDF document parser implementing DocumentParser interface
// ABOUTME: Extracts text with formatting and splits into chapters using 3-tier strategy

import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { Chapter } from '@/domain/entities/Chapter';
import {
  extractPdfText,
  getPdfOutline,
  isPdfScanned,
  calculateMedianFontSize,
} from '../utils/pdf-text-extraction';
import { detectChapters } from '../utils/pdf-chapter-detection';
import { groupIntoParagraphs, buildTipTapNode } from '../utils/pdf-formatting';

// Use crypto.randomUUID() on server, fallback for client
const generateId = (): string => {
  // eslint-disable-next-line no-undef
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // eslint-disable-next-line no-undef
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export class PdfParser implements DocumentParser {
  /**
   * Check if this parser supports the given file format
   */
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Parse PDF into plain text (legacy compatibility)
   */
  async parse(buffer: Buffer, filename: string): Promise<string> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      const pages = await extractPdfText(buffer);
      const textParts: string[] = [];

      for (const page of pages) {
        for (const item of page.items) {
          textParts.push(item.text);
        }
        textParts.push('\n\n'); // Page break
      }

      return textParts.join('').trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse PDF into chapters with formatting preservation
   * Uses 3-tier chapter detection: outline → font size → word limit fallback
   */
  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      // Check if PDF has extractable text
      if (await isPdfScanned(buffer)) {
        throw new Error(
          'Ce PDF semble être scanné. Seuls les PDFs textuels sont supportés.'
        );
      }

      // Extract text with formatting
      const pages = await extractPdfText(buffer);
      const outline = await getPdfOutline(buffer);
      const medianFontSize = calculateMedianFontSize(pages);

      // Detect chapter boundaries (3-tier strategy)
      const chapterBoundaries = detectChapters(pages, outline);

      // Convert each chapter to TipTap JSON and create Chapter entities
      const chapters: Chapter[] = [];

      for (let i = 0; i < chapterBoundaries.length; i++) {
        const boundary = chapterBoundaries[i];

        // Build TipTap document from chapter items
        const tipTapDoc = this.buildTipTapDocument(boundary.items, medianFontSize);

        // Auto-name chapters without titles
        const title = boundary.title || `Chapitre ${i + 1}`;

        chapters.push(
          new Chapter(
            generateId(),
            title,
            JSON.stringify(tipTapDoc),
            i
          )
        );
      }

      // Ensure at least one chapter
      if (chapters.length === 0) {
        const allItems = pages.flatMap(p => p.items);
        const tipTapDoc = this.buildTipTapDocument(allItems, medianFontSize);

        chapters.push(
          new Chapter(
            generateId(),
            'Chapitre 1',
            JSON.stringify(tipTapDoc),
            0
          )
        );
      }

      return chapters;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof Error && error.message.includes('scanné')) {
        throw error;
      }

      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Build TipTap document structure from text items
   */
  private buildTipTapDocument(
    items: import('../utils/pdf-text-extraction').PdfTextItem[],
    medianFontSize: number
  ): Record<string, unknown> {
    if (items.length === 0) {
      return {
        type: 'doc',
        content: [],
      };
    }

    // Group items into paragraphs based on vertical position
    const paragraphs = groupIntoParagraphs(items);

    // Convert each paragraph to TipTap node
    const content: Record<string, unknown>[] = [];

    for (const paragraphItems of paragraphs) {
      const node = buildTipTapNode(paragraphItems, medianFontSize);
      content.push(node);
    }

    return {
      type: 'doc',
      content,
    };
  }
}
