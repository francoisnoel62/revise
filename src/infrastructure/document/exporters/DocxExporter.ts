// ABOUTME: Enhanced DOCX exporter with rich text formatting and multi-chapter support
// ABOUTME: Converts TipTap JSON to formatted DOCX with bold, italic, underline, highlight

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  UnderlineType,
  PageBreak,
  HeadingLevel,
} from 'docx';
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

  /**
   * Export entire project with all chapters (Phase 2)
   * Chapters separated by page breaks
   */
  async exportProject(project: Project, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    try {
      const chapters = project.getChapters();
      const sections: Paragraph[] = [];

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const json = JSON.parse(chapter.getContent());

        // Add chapter title as H1
        sections.push(
          new Paragraph({
            text: chapter.getTitle(),
            heading: HeadingLevel.HEADING_1,
          })
        );

        // Convert TipTap JSON to DOCX paragraphs
        const paragraphs = this.convertTipTapToDocx(json);
        sections.push(...paragraphs);

        // Add page break between chapters (except after last)
        if (i < chapters.length - 1) {
          sections.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
      }

      const doc = new Document({
        sections: [
          {
            children: sections,
          },
        ],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export project: ${error.message}`);
      }
      throw new Error('Failed to export project');
    }
  }

  /**
   * Export single chapter (Phase 2)
   */
  async exportChapter(chapter: Chapter, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    try {
      const json = JSON.parse(chapter.getContent());
      const paragraphs = this.convertTipTapToDocx(json);

      // Add title as H1
      const sections = [
        new Paragraph({
          text: chapter.getTitle(),
          heading: HeadingLevel.HEADING_1,
        }),
        ...paragraphs,
      ];

      const doc = new Document({
        sections: [
          {
            children: sections,
          },
        ],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export chapter: ${error.message}`);
      }
      throw new Error('Failed to export chapter');
    }
  }

  /**
   * Convert TipTap JSON to DOCX paragraphs
   * @param json - TipTap JSON document
   * @returns Array of DOCX Paragraph objects
   */
  private convertTipTapToDocx(json: any): Paragraph[] {
    if (!json || !json.content) return [];

    const paragraphs: Paragraph[] = [];

    for (const node of json.content) {
      const paragraph = this.convertNode(node);
      if (paragraph) {
        paragraphs.push(paragraph);
      }
    }

    return paragraphs;
  }

  /**
   * Convert single TipTap node to DOCX paragraph
   */
  private convertNode(node: any): Paragraph | null {
    if (node.type === 'paragraph') {
      const runs = this.convertTextNodes(node.content || []);
      return new Paragraph({ children: runs });
    }

    if (node.type === 'heading') {
      const runs = this.convertTextNodes(node.content || []);
      const level = this.getHeadingLevel(node.attrs?.level || 1);
      return new Paragraph({
        children: runs,
        heading: level,
      });
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      // TODO: Implement list handling in future enhancement
      return null;
    }

    return null;
  }

  /**
   * Convert TipTap text nodes to DOCX TextRuns
   */
  private convertTextNodes(nodes: any[]): TextRun[] {
    if (!nodes || nodes.length === 0) {
      return [new TextRun('')];
    }

    return nodes.map((node) => {
      if (node.type !== 'text') return new TextRun('');

      const marks = node.marks || [];
      const isBold = marks.some((m: any) => m.type === 'bold');
      const isItalic = marks.some((m: any) => m.type === 'italic');
      const isUnderline = marks.some((m: any) => m.type === 'underline');
      const highlightMark = marks.find((m: any) => m.type === 'highlight');

      const runOptions: any = {
        text: node.text || '',
      };

      if (isBold) runOptions.bold = true;
      if (isItalic) runOptions.italics = true;
      if (isUnderline) {
        runOptions.underline = { type: UnderlineType.SINGLE };
      }
      if (highlightMark) {
        // DOCX highlight colors are limited
        runOptions.highlight = this.getHighlightColor(highlightMark.attrs?.color);
      }

      return new TextRun(runOptions);
    });
  }

  /**
   * Map TipTap heading level to DOCX HeadingLevel
   */
  private getHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
    const mapping: { [key: number]: typeof HeadingLevel[keyof typeof HeadingLevel] } = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };
    return mapping[level] || HeadingLevel.HEADING_1;
  }

  /**
   * Map TipTap highlight color to DOCX highlight
   * DOCX only supports limited colors
   */
  private getHighlightColor(color?: string): string {
    if (!color) return 'yellow';

    // Map common highlight colors to DOCX colors
    const colorMap: { [key: string]: string } = {
      '#fbbf24': 'yellow', // Tailwind amber-400
      '#fef08a': 'yellow',
      '#bef264': 'green',
      '#86efac': 'green',
      '#93c5fd': 'cyan',
      '#c4b5fd': 'magenta',
      '#fca5a5': 'red',
    };

    return colorMap[color] || 'yellow';
  }

  /**
   * Split plain text into paragraphs (legacy method)
   */
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
