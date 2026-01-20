// ABOUTME: Parser for folders containing multiple Markdown files
// ABOUTME: Each .md file becomes a chapter, ordered by numeric prefix then alphabetically

import { marked } from 'marked';
import { FolderParser, FolderFile } from '@/domain/interfaces/FolderParser';
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

export class MarkdownFolderParser implements FolderParser {
  constructor() {
    // Configure marked for standard paragraph handling
    // breaks: false ensures paragraphs are separated by blank lines (standard Markdown)
    marked.use({
      breaks: false,
      gfm: true,
    });
  }

  /**
   * Check if the folder contains at least one .md file
   */
  supports(files: FolderFile[]): boolean {
    return files.some(file => file.name.toLowerCase().endsWith('.md'));
  }

  /**
   * Parse all .md files in the folder into chapters
   * Order: alphabetical by folder path, then numeric prefix on filename
   */
  async parseToChapters(files: FolderFile[]): Promise<Chapter[]> {
    // Filter to only .md files
    const mdFiles = files.filter(file => file.name.toLowerCase().endsWith('.md'));

    if (mdFiles.length === 0) {
      throw new Error('Aucun fichier .md trouvé dans le dossier');
    }

    // Sort files: alphabetical by directory, then numeric by filename prefix
    const sortedFiles = this.sortFiles(mdFiles);

    // Convert each file to a chapter
    const chapters: Chapter[] = [];

    for (let index = 0; index < sortedFiles.length; index++) {
      const file = sortedFiles[index];
      const chapter = await this.fileToChapter(file, index);
      chapters.push(chapter);
    }

    return chapters;
  }

  /**
   * Sort files by directory (alphabetical) then by numeric prefix
   */
  private sortFiles(files: FolderFile[]): FolderFile[] {
    return [...files].sort((a, b) => {
      // Get directory paths (everything before the filename)
      const dirA = this.getDirectoryPath(a.relativePath);
      const dirB = this.getDirectoryPath(b.relativePath);

      // First, compare directories alphabetically
      if (dirA !== dirB) {
        return dirA.localeCompare(dirB);
      }

      // Same directory: compare by numeric prefix
      const numA = this.extractNumericPrefix(a.name);
      const numB = this.extractNumericPrefix(b.name);

      // If both have numeric prefixes, compare numerically
      if (numA !== null && numB !== null) {
        return numA - numB;
      }

      // If only one has a numeric prefix, it comes first
      if (numA !== null) return -1;
      if (numB !== null) return 1;

      // Neither has a numeric prefix: compare alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get directory path from relative path
   * "partie-1/01-intro.md" → "partie-1"
   * "01-intro.md" → ""
   */
  private getDirectoryPath(relativePath: string): string {
    const parts = relativePath.split('/');
    parts.pop(); // Remove filename
    return parts.join('/');
  }

  /**
   * Extract numeric prefix from filename
   * "01-intro.md" → 1
   * "02-chapitre.md" → 2
   * "intro.md" → null
   */
  private extractNumericPrefix(filename: string): number | null {
    const match = filename.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Extract chapter title from filename
   * Removes extension and numeric prefix
   * "01-introduction.md" → "introduction"
   * "02-le-voyage.md" → "le-voyage"
   * "epilogue.md" → "epilogue"
   */
  private extractTitleFromFilename(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.md$/i, '');

    // Remove numeric prefix (e.g., "01-", "02-", "123-")
    title = title.replace(/^\d+[-_\s]*/, '');

    // Replace remaining dashes/underscores with spaces for readability
    title = title.replace(/[-_]/g, ' ');

    // Capitalize first letter
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return title || 'Sans titre';
  }

  /**
   * Convert a single file to a Chapter
   */
  private async fileToChapter(file: FolderFile, order: number): Promise<Chapter> {
    let markdown = file.buffer.toString('utf-8');

    // Strip YAML frontmatter if present
    markdown = this.stripYamlFrontmatter(markdown);

    // Transform text: replace em dash with semicolon
    markdown = this.transformText(markdown);

    // Strip lists (not supported)
    markdown = this.stripLists(markdown);

    // Convert Markdown to HTML
    const html = await marked.parse(markdown);

    // Clean HTML (remove unsupported elements)
    const cleanedHtml = this.cleanHtml(html);

    // Convert to TipTap JSON
    const json = htmlToTipTapJSON(cleanedHtml);

    // Extract title from filename
    const title = this.extractTitleFromFilename(file.name);

    return new Chapter(
      generateId(),
      title,
      JSON.stringify(json),
      order
    );
  }

  /**
   * Transform text content: replace em dash with semicolon
   */
  private transformText(text: string): string {
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
   */
  private stripLists(markdown: string): string {
    let result = markdown.replace(/^[\s]*[-*+]\s+/gm, '');
    result = result.replace(/^[\s]*\d+\.\s+/gm, '');
    return result;
  }

  /**
   * Clean HTML by removing unsupported elements and adding indentation
   * Adds: data-indent="true" to all paragraphs for first-line indentation
   * Adds: font sizes via spans (H1=16pt, H2=14pt, paragraphs=12pt)
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

    // Convert list items to paragraphs
    result = result.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '<p>$1</p>');
    result = result.replace(/<\/?[ou]l[^>]*>/gi, '');

    // Remove blockquotes but keep content
    result = result.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '$1');

    // Add font sizes via spans inside headings: H1=16pt, H2=14pt
    // TipTap FontSize works on textStyle (inline), not block elements
    result = result.replace(/<h1>([\s\S]*?)<\/h1>/gi, '<h1><span style="font-size: 16pt">$1</span></h1>');
    result = result.replace(/<h2>([\s\S]*?)<\/h2>/gi, '<h2><span style="font-size: 14pt">$1</span></h2>');

    // Add first-line indentation and font size to all paragraphs (12pt)
    result = result.replace(/<p>([\s\S]*?)<\/p>/gi, '<p data-indent="true"><span style="font-size: 12pt">$1</span></p>');

    return result;
  }
}
