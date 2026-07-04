// ABOUTME: DOCX exporter — single style rattached exclusively to the passerelle publication profile.
// ABOUTME: Converts TipTap JSON to formatted DOCX (bold, italic, underline, highlight, font, size).

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  UnderlineType,
  PageBreak,
  HeadingLevel,
  AlignmentType,
  ImageRun,
} from 'docx';
import { DocumentExporter, ExportOptions } from '@/domain/interfaces/DocumentExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

// twips: 1 inch = 1440 twips, 1 cm ≈ 567 twips
const CM_TO_TWIPS = 567;

export class DocxExporter implements DocumentExporter {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.docx');
  }

  async export(content: string, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
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

      return await Packer.toBuffer(doc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export docx: ${error.message}`);
      }
      throw new Error('Failed to export docx file');
    }
  }

  async exportProject(project: Project, filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    try {
      return await this.buildDocument(project.getChapters(), options);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export project: ${error.message}`);
      }
      throw new Error('Failed to export project');
    }
  }

  async exportChapter(chapter: Chapter, filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    try {
      return await this.buildDocument([chapter], options);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export chapter: ${error.message}`);
      }
      throw new Error('Failed to export chapter');
    }
  }

  async exportChapters(chapters: Chapter[], filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    if (chapters.length === 0) {
      throw new Error('No chapters to export');
    }

    try {
      return await this.buildDocument(chapters, options);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export chapters: ${error.message}`);
      }
      throw new Error('Failed to export chapters');
    }
  }

  /**
   * Single-section document, geometry read from PublicationProfile.passerelle().values.
   * No title injection: each chapter renders exactly its own content (heading included
   * when the author has one), matching the aperçu live and the PDF export.
   */
  private async buildDocument(chapters: Chapter[], options?: ExportOptions): Promise<Buffer> {
    const profile = PublicationProfile.passerelle().values;
    const coverParagraph = await this.createCoverImageParagraph(options?.coverImageUrl);

    const children: Paragraph[] = [];

    if (coverParagraph) {
      children.push(coverParagraph);
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const json = JSON.parse(chapter.getContent());
      children.push(...this.convertTipTapToDocx(json, profile));

      if (i < chapters.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: Math.round(profile.pageWidthInches * 1440),
                height: Math.round(profile.pageHeightInches * 1440),
              },
              margin: {
                top: Math.round(profile.marginTopCentimeters * CM_TO_TWIPS),
                bottom: Math.round(profile.marginBottomCentimeters * CM_TO_TWIPS),
                left: Math.round(profile.marginInsideCentimeters * CM_TO_TWIPS),
                right: Math.round(profile.marginOutsideCentimeters * CM_TO_TWIPS),
              },
            },
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Create a paragraph with cover image if URL is provided
   */
  private async createCoverImageParagraph(coverImageUrl?: string): Promise<Paragraph | null> {
    if (!coverImageUrl) return null;

    try {
      const response = await fetch(coverImageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch cover image: ${response.status}`);
        return null;
      }

      const imageBuffer = await response.arrayBuffer();

      const profile = PublicationProfile.passerelle().values;
      const pageWidthEmu = profile.pageWidthInches * 914400;
      const pageHeightEmu = profile.pageHeightInches * 914400;
      const maxWidth = pageWidthEmu * 0.8;
      const maxHeight = pageHeightEmu * 0.8;

      const imageRun = new ImageRun({
        data: Buffer.from(imageBuffer),
        transformation: {
          width: (maxWidth / 914400) * 72,
          height: (maxHeight / 914400) * 72,
        },
        type: 'png',
      });

      return new Paragraph({
        children: [imageRun],
        alignment: AlignmentType.CENTER,
      });
    } catch (error) {
      console.warn('Failed to create cover image paragraph:', error);
      return null;
    }
  }

  /**
   * Convert TipTap JSON document to an array of DOCX Paragraphs, applying the
   * passerelle profile's font/size/line-height as the base style.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertTipTapToDocx(json: any, profile: ReturnType<typeof PublicationProfile.passerelle>['values']): Paragraph[] {
    if (!json || !json.content) return [];

    const paragraphs: Paragraph[] = [];

    for (const node of json.content) {
      const paragraph = this.convertNode(node, profile);
      if (paragraph) {
        paragraphs.push(paragraph);
      }
    }

    return paragraphs;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertNode(node: any, profile: ReturnType<typeof PublicationProfile.passerelle>['values']): Paragraph | null {
    if (node.type === 'paragraph') {
      const runs = this.convertTextNodes(node.content || [], profile);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = { children: runs };

      if (node.attrs?.textAlign) {
        opts.alignment = this.convertAlignment(node.attrs.textAlign);
      }
      if (node.attrs?.indent) {
        opts.indent = { firstLine: 720 }; // 0.5" legacy indent
      }

      return new Paragraph(opts);
    }

    if (node.type === 'heading') {
      const runs = this.convertTextNodes(node.content || [], profile);
      return new Paragraph({
        children: runs,
        heading: this.getHeadingLevel(node.attrs?.level || 1),
      });
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      // TODO: implement list handling
      return null;
    }

    return null;
  }

  /**
   * Convert TipTap text leaf nodes to DOCX TextRuns, applying marks (bold, italic, etc.).
   * The passerelle base font/size is applied unless the author has explicitly set
   * a different font or size via the textStyle mark.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertTextNodes(nodes: any[], profile: ReturnType<typeof PublicationProfile.passerelle>['values']): TextRun[] {
    if (!nodes || nodes.length === 0) {
      return [new TextRun('')];
    }

    return nodes.map((node) => {
      if (node.type !== 'text') return new TextRun('');

      const marks = node.marks || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isBold = marks.some((m: any) => m.type === 'bold');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isItalic = marks.some((m: any) => m.type === 'italic');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isUnderline = marks.some((m: any) => m.type === 'underline');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightMark = marks.find((m: any) => m.type === 'highlight');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textStyleMark = marks.find((m: any) => m.type === 'textStyle');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runOptions: any = { text: node.text || '' };

      if (isBold) runOptions.bold = true;
      if (isItalic) runOptions.italics = true;
      if (isUnderline) runOptions.underline = { type: UnderlineType.SINGLE };
      if (highlightMark) {
        runOptions.highlight = this.getHighlightColor(highlightMark.attrs?.color);
      }

      if (textStyleMark?.attrs) {
        if (textStyleMark.attrs.fontFamily) {
          runOptions.font = textStyleMark.attrs.fontFamily;
        }
        if (textStyleMark.attrs.fontSize) {
          const ptValue = parseInt(textStyleMark.attrs.fontSize);
          if (!isNaN(ptValue)) {
            runOptions.size = ptValue * 2; // pt → half-points
          }
        }
      }

      if (!runOptions.font) runOptions.font = profile.bodyFontFamily;
      if (!runOptions.size) runOptions.size = profile.bodyFontSizePoints * 2;

      return new TextRun(runOptions);
    });
  }

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

  private getHighlightColor(color?: string): string {
    if (!color) return 'yellow';

    const colorMap: { [key: string]: string } = {
      '#fbbf24': 'yellow',
      '#fef08a': 'yellow',
      '#bef264': 'green',
      '#86efac': 'green',
      '#93c5fd': 'cyan',
      '#c4b5fd': 'magenta',
      '#fca5a5': 'red',
    };

    return colorMap[color] || 'yellow';
  }

  private convertAlignment(align: string): typeof AlignmentType[keyof typeof AlignmentType] {
    const mapping: { [key: string]: typeof AlignmentType[keyof typeof AlignmentType] } = {
      left: AlignmentType.LEFT,
      center: AlignmentType.CENTER,
      right: AlignmentType.RIGHT,
      justify: AlignmentType.JUSTIFIED,
    };
    return mapping[align] || AlignmentType.JUSTIFIED;
  }

  private splitIntoParagraphs(content: string): string[] {
    if (content.length === 0) return [''];
    let paragraphs = content.split(/\n\n+/);
    paragraphs = paragraphs.flatMap((p) => p.split('\n'));
    const filtered = paragraphs.filter((p) => p.trim().length > 0);
    return filtered.length > 0 ? filtered : [''];
  }
}
