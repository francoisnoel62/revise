// ABOUTME: Concrete implementation of DocumentExporter for .docx file generation
// ABOUTME: Creates Word documents from plain text with basic paragraph formatting

import { Document, Packer, Paragraph, TextRun } from 'docx';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

export class DocxExporter implements DocumentExporter {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.docx');
  }

  async export(content: string, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      // Split content into paragraphs (by double newline or single newline)
      const paragraphs = this.splitIntoParagraphs(content);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs.map(
              (text) =>
                new Paragraph({
                  children: [new TextRun(text)],
                })
            ),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export docx: ${error.message}`);
      }
      throw new Error('Failed to export docx file');
    }
  }

  async exportProject(_project: Project, _filename: string): Promise<Buffer> {
    // TODO: Phase 2.2 - Implement project export with formatted chapters
    throw new Error('exportProject not yet implemented - will be added in Phase 2.2');
  }

  async exportChapter(_chapter: Chapter, _filename: string): Promise<Buffer> {
    // TODO: Phase 2.2 - Implement single chapter export with formatting
    throw new Error('exportChapter not yet implemented - will be added in Phase 2.2');
  }

  private splitIntoParagraphs(content: string): string[] {
    if (content.length === 0) {
      return [''];
    }

    // Split by double newline first (clear paragraph breaks)
    let paragraphs = content.split(/\n\n+/);

    // Then split single newlines within those into separate paragraphs
    paragraphs = paragraphs.flatMap((p) => p.split('\n'));

    // Filter out empty paragraphs but keep at least one
    const filtered = paragraphs.filter((p) => p.trim().length > 0);
    return filtered.length > 0 ? filtered : [''];
  }
}
