// ABOUTME: Routes document parsing to appropriate parser based on file extension
// ABOUTME: Supports .docx and .md files via DocxParser and MarkdownParser

import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { Chapter } from '@/domain/entities/Chapter';

export class CompositeDocumentParser implements DocumentParser {
  constructor(private readonly parsers: DocumentParser[]) {
    if (parsers.length === 0) {
      throw new Error('CompositeDocumentParser requires at least one parser');
    }
  }

  /**
   * Check if any registered parser supports the given file format
   */
  supports(filename: string): boolean {
    return this.parsers.some(parser => parser.supports(filename));
  }

  /**
   * Parse document into plain text using the appropriate parser
   */
  async parse(buffer: Buffer, filename: string): Promise<string> {
    const parser = this.findParser(filename);
    return parser.parse(buffer, filename);
  }

  /**
   * Parse document into chapters using the appropriate parser
   */
  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    const parser = this.findParser(filename);
    return parser.parseToChapters(buffer, filename);
  }

  /**
   * Find the parser that supports the given filename
   * @throws Error if no parser supports the format
   */
  private findParser(filename: string): DocumentParser {
    const parser = this.parsers.find(p => p.supports(filename));

    if (!parser) {
      const extension = filename.split('.').pop() || filename;
      throw new Error(
        `Format de fichier non supporté: .${extension}. Formats acceptés: .docx, .md`
      );
    }

    return parser;
  }

  /**
   * Get list of supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.docx', '.md'];
  }
}
