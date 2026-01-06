// ABOUTME: Enhanced DOCX parser with rich text formatting and multi-chapter support
// ABOUTME: Converts DOCX to TipTap JSON with chapter splitting by H1 headings

import mammoth from 'mammoth';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { Chapter } from '@/domain/entities/Chapter';
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

export class DocxParser implements DocumentParser {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.docx');
  }

  async parse(buffer: Buffer, filename: string): Promise<string> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse docx: ${error.message}`);
      }
      throw new Error('Failed to parse docx file');
    }
  }

  /**
   * Parse DOCX into chapters (Phase 2 - with formatting)
   * Splits by H1 headings to create chapters
   */
  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      // Convert to HTML with formatting
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: [
            'u => u', // Preserve underlines
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
          ],
        }
      );

      const html = result.value;

      // Split by H1 tags
      const sections = this.splitByHeadings(html);

      // Convert each section to a Chapter
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
      if (error instanceof Error) {
        throw new Error(`Failed to parse docx: ${error.message}`);
      }
      throw new Error('Failed to parse docx file');
    }
  }

  /**
   * Split HTML by H1 headings into sections
   * @param html - HTML string from mammoth
   * @returns Array of sections with title and content
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
   * Strip HTML tags from string
   * @param html - HTML string
   * @returns Plain text
   */
  private stripHTMLTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
