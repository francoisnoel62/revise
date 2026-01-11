// ABOUTME: PDF document parser with AI-powered text structuring
// ABOUTME: Extracts raw text from PDF, uses AI to structure into HTML, converts to TipTap JSON

import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { Chapter } from '@/domain/entities/Chapter';
import { getDocumentProxy } from 'unpdf';
import { htmlToTipTapJSON } from '../utils/tiptap-conversion';

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
  private llmProvider?: LLMProvider;

  /**
   * Create PdfParser with optional LLMProvider for AI-powered text structuring.
   * @param llmProvider - Optional AI provider for intelligent text structuring
   */
  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
  }

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
      return await this.extractRawText(buffer);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse PDF into chapters with formatting preservation.
   * Uses AI to structure raw text into HTML, then converts to TipTap JSON.
   * Falls back to simple paragraph splitting if no LLMProvider.
   */
  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      // Step 1: Extract raw text from PDF
      const rawText = await this.extractRawText(buffer);

      if (!rawText.trim()) {
        throw new Error(
          'Ce PDF semble être scanné ou vide. Seuls les PDFs textuels sont supportés.'
        );
      }

      // Step 2: Structure text into HTML (AI or fallback)
      let html: string;
      if (this.llmProvider) {
        html = await this.llmProvider.structureRawText(rawText);
      } else {
        html = this.simpleTextToHtml(rawText);
      }

      // Step 3: Split by H1 headings (same logic as DocxParser)
      const sections = this.splitByHeadings(html);

      // Step 4: Convert each section to a Chapter
      const chapters = sections.map((section, index) => {
        const json = htmlToTipTapJSON(section.content);
        const title = section.title || `Chapitre ${index + 1}`;

        return new Chapter(
          generateId(),
          title,
          JSON.stringify(json),
          index
        );
      });

      // If no chapters found (no H1 headings), create single chapter
      if (chapters.length === 0) {
        const json = htmlToTipTapJSON(html);
        return [
          new Chapter(
            generateId(),
            'Chapitre 1',
            JSON.stringify(json),
            0
          ),
        ];
      }

      return chapters;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof Error && (
        error.message.includes('scanné') ||
        error.message.includes('vide')
      )) {
        throw error;
      }

      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Extract raw text from PDF without any layout reconstruction.
   * Simple concatenation of all text items.
   */
  private async extractRawText(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8Array);
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        // Type guard: only process text items
        if (!('str' in item)) continue;
        // Include ALL text, even whitespace (important for word separation)
        textParts.push(item.str);
      }

      // Add page break marker
      textParts.push('\n\n');
    }

    return textParts.join('');
  }

  /**
   * Simple fallback: convert raw text to basic HTML paragraphs.
   * Used when no LLMProvider is available.
   */
  private simpleTextToHtml(text: string): string {
    // Split by double newlines (paragraph breaks)
    const paragraphs = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return paragraphs
      .map(p => `<p>${this.escapeHtml(p.replace(/\n/g, ' '))}</p>`)
      .join('');
  }

  /**
   * Escape HTML special characters.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Split HTML by H1 headings into sections.
   * Same logic as DocxParser for consistency.
   */
  private splitByHeadings(
    html: string
  ): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    // Regular expression to match H1 tags and capture content
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    const matches = Array.from(html.matchAll(h1Regex));

    if (matches.length === 0) {
      // No H1 headings found, return entire content
      return [];
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = this.stripHTMLTags(match[1]);
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : html.length;
      const content = html.substring(startIndex, endIndex);

      sections.push({ title, content });
    }

    // Handle content before first H1
    if (matches[0].index! > 0) {
      const preamble = html.substring(0, matches[0].index!);
      if (preamble.trim()) {
        sections.unshift({ title: '', content: preamble });
      }
    }

    return sections;
  }

  /**
   * Strip HTML tags from string.
   */
  private stripHTMLTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
