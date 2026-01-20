// ABOUTME: Markdown parser for single .md files with chapter splitting by H1 headings
// ABOUTME: Converts Markdown to TipTap JSON, preserving bold, italic, and horizontal rules

import { marked } from 'marked';
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
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export class MarkdownParser implements DocumentParser {
  constructor() {
    // Configure marked for standard paragraph handling
    // breaks: false ensures paragraphs are separated by blank lines (standard Markdown)
    marked.use({
      breaks: false, // Paragraphs require blank lines between them
      gfm: true, // GitHub Flavored Markdown
    });
  }

  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.md');
  }

  async parse(buffer: Buffer, filename: string): Promise<string> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    const markdown = buffer.toString('utf-8');
    return this.transformText(markdown);
  }

  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      let markdown = buffer.toString('utf-8');

      // Strip YAML frontmatter if present
      markdown = this.stripYamlFrontmatter(markdown);

      // Transform text: replace em dash with semicolon
      markdown = this.transformText(markdown);

      // Pre-process: convert lists to plain text (lists are excluded)
      markdown = this.stripLists(markdown);

      // Convert Markdown to HTML
      const html = await marked.parse(markdown);

      // Post-process HTML: strip unwanted elements (code blocks, links, images)
      const cleanedHtml = this.cleanHtml(html);

      // Split by H1 tags
      const sections = this.splitByHeadings(cleanedHtml);

      // Convert each section to a Chapter
      const chapters = sections.map((section, index) => {
        const json = htmlToTipTapJSON(section.content);
        const title = section.title || (index === 0 ? 'Introduction' : `Chapitre ${index + 1}`);

        return new Chapter(
          generateId(),
          title,
          JSON.stringify(json),
          index
        );
      });

      // If no chapters found (no H1 headings), create single chapter
      if (chapters.length === 0) {
        const json = htmlToTipTapJSON(cleanedHtml);
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
        throw new Error(`Failed to parse markdown: ${error.message}`);
      }
      throw new Error('Failed to parse markdown file');
    }
  }

  /**
   * Transform text content: replace em dash with semicolon
   */
  private transformText(text: string): string {
    // Replace em dash (—) with semicolon (;)
    return text.replace(/—/g, ';');
  }

  /**
   * Strip YAML frontmatter from the beginning of markdown content
   * Format: starts with ---, ends with ---
   */
  private stripYamlFrontmatter(markdown: string): string {
    return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
  }

  /**
   * Strip Markdown lists and convert them to plain text
   * Lists are excluded from the supported formatting
   */
  private stripLists(markdown: string): string {
    // Replace unordered list items (-, *, +) with plain text
    let result = markdown.replace(/^[\s]*[-*+]\s+/gm, '');

    // Replace ordered list items (1., 2., etc.) with plain text
    result = result.replace(/^[\s]*\d+\.\s+/gm, '');

    return result;
  }

  /**
   * Clean HTML by removing unsupported elements and adding indentation
   * Keeps: p, strong, em, h1-h6, hr, br
   * Removes: code, pre, a (converts to text), img, ul, ol, li
   * Adds: data-indent="true" to all paragraphs for first-line indentation
   * Adds: font sizes (H1=16pt, H2=14pt, paragraphs=12pt)
   */
  private cleanHtml(html: string): string {
    let result = html;

    // Remove code blocks (keep content)
    result = result.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '<p>$1</p>');
    result = result.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '$1');

    // Remove links but keep text content
    result = result.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

    // Remove images
    result = result.replace(/<img[^>]*>/gi, '');

    // Convert list items to paragraphs (in case lists weren't fully stripped)
    result = result.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '<p>$1</p>');
    result = result.replace(/<\/?[ou]l[^>]*>/gi, '');

    // Remove blockquotes but keep content
    result = result.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '$1');

    // Add font sizes to headings: H1=16pt, H2=14pt
    result = result.replace(/<h1>/gi, '<h1 style="font-size: 16pt">');
    result = result.replace(/<h2>/gi, '<h2 style="font-size: 14pt">');

    // Add first-line indentation and font size to all paragraphs (12pt)
    result = result.replace(/<p>/gi, '<p data-indent="true" style="font-size: 12pt">');

    return result;
  }

  /**
   * Split HTML by H1 headings into sections
   */
  private splitByHeadings(html: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    // Regular expression to match H1 tags and capture content
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    const matches = Array.from(html.matchAll(h1Regex));

    if (matches.length === 0) {
      // No H1 headings found, return empty to trigger single chapter fallback
      return [];
    }

    // Handle content before first H1 (preamble/introduction)
    if (matches[0].index! > 0) {
      const preamble = html.substring(0, matches[0].index!);
      if (preamble.trim()) {
        sections.push({ title: '', content: preamble });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = this.stripHtmlTags(match[1]);
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : html.length;
      const content = html.substring(startIndex, endIndex);

      sections.push({ title, content });
    }

    return sections;
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
