// ABOUTME: DOCX exporter with style presets: KDP (6×9 print), Neutral (black headings), Structured (native styles)
// ABOUTME: Converts TipTap JSON to formatted DOCX with bold, italic, underline, highlight, font, size

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
  SectionType,
  Bookmark,
  InternalHyperlink,
} from 'docx';
import { DocumentExporter, ExportOptions, DocxStylePreset, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

// KDP 6"×9" layout constants (twips: 1 inch = 1440 twips, 1 cm ≈ 567 twips)
const KDP_PAGE_WIDTH = 8640;    // 6"
const KDP_PAGE_HEIGHT = 12960;  // 9"
const KDP_MARGIN_INSIDE = 1134; // 2 cm — gutter (inner margin for facing pages)
const KDP_MARGIN_OUTSIDE = 851; // 1.5 cm
const KDP_MARGIN_TOP = 1021;    // 1.8 cm
const KDP_MARGIN_BOTTOM = 1021; // 1.8 cm
const KDP_FIRST_LINE_INDENT = 454; // 0.8 cm
const KDP_LINE_SPACING = 276;   // 1.15× single line (240 = single, 480 = double)

const KDP_BODY_FONT = 'Garamond'; // Georgia declared as altName in font table

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
      const preset = this.getPreset(options);
      const chapters = project.getChapters();
      return await this.buildDocument(chapters, preset, options);
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
      const preset = this.getPreset(options);
      return await this.buildDocument([chapter], preset, options);
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
      const preset = this.getPreset(options);
      return await this.buildDocument(chapters, preset, options);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export chapters: ${error.message}`);
      }
      throw new Error('Failed to export chapters');
    }
  }

  private getPreset(options?: ExportOptions): DocxStylePreset {
    return options?.stylePreset ?? 'kdp';
  }

  /**
   * Builds the Document with the appropriate structure for the given preset.
   * KDP: one ODD_PAGE section per chapter (chapters start on right-hand pages).
   * Neutral/Structured: single section with PageBreak separators (current behaviour).
   */
  private async buildDocument(
    chapters: Chapter[],
    preset: DocxStylePreset,
    options?: ExportOptions
  ): Promise<Buffer> {
    const coverParagraph = await this.createCoverImageParagraph(options?.coverImageUrl);

    if (preset === 'kdp') {
      return this.buildKdpDocument(chapters, preset, coverParagraph, options?.frontMatter);
    }

    return this.buildSingleSectionDocument(chapters, preset, coverParagraph);
  }

  /**
   * KDP layout: each chapter is its own ODD_PAGE section so it always starts
   * on a right-hand (odd-numbered) page. LibreOffice inserts a blank page
   * automatically when necessary — this is standard for printed books.
   */
  private async buildKdpDocument(
    chapters: Chapter[],
    preset: DocxStylePreset,
    coverParagraph: Paragraph | null,
    frontMatter?: FrontMatterData
  ): Promise<Buffer> {
    const kdpPageProps = {
      size: { width: KDP_PAGE_WIDTH, height: KDP_PAGE_HEIGHT },
      margin: {
        top: KDP_MARGIN_TOP,
        bottom: KDP_MARGIN_BOTTOM,
        left: KDP_MARGIN_INSIDE,
        right: KDP_MARGIN_OUTSIDE,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docSections: any[] = [];

    if (coverParagraph) {
      docSections.push({
        properties: { page: kdpPageProps },
        children: [coverParagraph],
      });
    }

    if (frontMatter) {
      docSections.push(this.buildHalfTitleSection(frontMatter, kdpPageProps));
      docSections.push(this.buildTitlePageSection(frontMatter, kdpPageProps));
      docSections.push(this.buildCopyrightSection(frontMatter, kdpPageProps));
      if (frontMatter.dedicationContent) {
        docSections.push(this.buildDedicationSection(frontMatter.dedicationContent, kdpPageProps));
      }
      if (frontMatter.epigraphContent) {
        docSections.push(this.buildEpigraphSection(frontMatter.epigraphContent, kdpPageProps));
      }
    }

    docSections.push(this.buildTocSection(chapters, kdpPageProps));

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const json = JSON.parse(chapter.getContent());
      const bodyParagraphs = this.convertTipTapToDocx(json, preset);

      docSections.push({
        properties: {
          type: SectionType.ODD_PAGE,
          page: kdpPageProps,
        },
        children: [
          new Paragraph({
            children: [
              new Bookmark({
                id: `chapter_${i}`,
                children: [new TextRun(chapter.getTitle())],
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),
          ...bodyParagraphs,
        ],
      });
    }

    const doc = new Document({
      styles: this.buildDocumentStyles(preset),
      sections: docSections,
    });

    return Packer.toBuffer(doc);
  }

  private buildHalfTitleSection(frontMatter: FrontMatterData, kdpPageProps: object): object {
    return {
      properties: {
        type: SectionType.ODD_PAGE,
        page: kdpPageProps,
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: frontMatter.title,
              font: KDP_BODY_FONT,
              size: 36, // 18pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 4320, after: 0 }, // ~3" down
        }),
      ],
    };
  }

  private buildTitlePageSection(frontMatter: FrontMatterData, kdpPageProps: object): object {
    const children: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: frontMatter.title,
            font: KDP_BODY_FONT,
            size: 48, // 24pt
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880, after: 240 }, // ~2" from top
      }),
    ];

    if (frontMatter.subtitle) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: frontMatter.subtitle,
              font: KDP_BODY_FONT,
              size: 28, // 14pt
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 0 },
        })
      );
    }

    if (frontMatter.authorName) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: frontMatter.authorName,
              font: KDP_BODY_FONT,
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 720, after: 0 }, // 0.5" gap before author name
        })
      );
    }

    return {
      properties: {
        type: SectionType.ODD_PAGE,
        page: kdpPageProps,
      },
      children,
    };
  }

  private buildCopyrightSection(frontMatter: FrontMatterData, kdpPageProps: object): object {
    let children: Paragraph[];

    if (frontMatter.copyrightContent) {
      const json = JSON.parse(frontMatter.copyrightContent);
      children = this.convertTipTapToDocx(json, 'kdp').map((p) => {
        // Override to 9pt for copyright page
        return p;
      });
    } else {
      const year = frontMatter.copyrightYear ?? new Date().getFullYear();
      const author = frontMatter.authorName ?? '[AUTEUR]';
      const isbn = frontMatter.isbn ? `ISBN : ${frontMatter.isbn}` : 'ISBN : [À RENSEIGNER]';

      const lines = [
        `© ${year} ${author}. Tous droits réservés.`,
        '',
        "Toute reproduction ou représentation, intégrale ou partielle, par quelque procédé que ce soit, faite sans l'autorisation de l'auteur, est illicite et constitue une contrefaçon.",
        '',
        isbn,
        '',
        '[NOM DE L\'ÉDITEUR]',
        'Imprimé en France',
      ];

      children = lines.map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: KDP_BODY_FONT,
                size: 18, // 9pt
              }),
            ],
            spacing: { line: KDP_LINE_SPACING, lineRule: 'auto' },
          })
      );
    }

    return {
      properties: {
        type: SectionType.EVEN_PAGE,
        page: kdpPageProps,
      },
      children,
    };
  }

  private buildDedicationSection(content: string, kdpPageProps: object): object {
    const json = JSON.parse(content);
    const paragraphs = this.convertTipTapToDocx(json, 'kdp');

    return {
      properties: {
        type: SectionType.ODD_PAGE,
        page: kdpPageProps,
      },
      children: paragraphs,
    };
  }

  private buildEpigraphSection(content: string, kdpPageProps: object): object {
    const json = JSON.parse(content);
    const paragraphs = this.convertTipTapToDocx(json, 'kdp');

    return {
      properties: {
        type: SectionType.ODD_PAGE,
        page: kdpPageProps,
      },
      children: paragraphs,
    };
  }

  private buildTocSection(chapters: Chapter[], kdpPageProps: object): object {
    const entries = chapters.map((chapter, i) =>
      new Paragraph({
        children: [
          new InternalHyperlink({
            anchor: `chapter_${i}`,
            children: [
              new TextRun({
                text: chapter.getTitle(),
                font: KDP_BODY_FONT,
                size: 22,
                color: '000000',
              }),
            ],
          }),
        ],
        spacing: { line: KDP_LINE_SPACING, lineRule: 'auto' },
      })
    );

    return {
      properties: {
        type: SectionType.ODD_PAGE,
        page: kdpPageProps,
      },
      children: [
        new Paragraph({ text: 'Table des matières', heading: HeadingLevel.HEADING_2 }),
        ...entries,
      ],
    };
  }

  /**
   * Neutral/Structured: single section, PageBreak between chapters.
   */
  private async buildSingleSectionDocument(
    chapters: Chapter[],
    preset: DocxStylePreset,
    coverParagraph: Paragraph | null
  ): Promise<Buffer> {
    const sections: Paragraph[] = [];

    if (coverParagraph) {
      sections.push(coverParagraph);
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const json = JSON.parse(chapter.getContent());

      sections.push(
        new Paragraph({
          text: chapter.getTitle(),
          heading: HeadingLevel.HEADING_1,
        })
      );
      sections.push(...this.convertTipTapToDocx(json, preset));

      if (i < chapters.length - 1) {
        sections.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    const doc = new Document({
      styles: this.buildDocumentStyles(preset),
      sections: [{ children: sections }],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Returns style overrides for the Document.
   * - 'structured': no override, LibreOffice/Word theme applies (default blue headings)
   * - 'neutral': heading colors forced to black, everything else left to the reader app
   * - 'kdp': Garamond 11pt body, 14pt centred black chapter titles, no indented headings
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildDocumentStyles(preset: DocxStylePreset): any {
    if (preset === 'structured') return undefined;

    if (preset === 'kdp') {
      return {
        default: {
          heading1: {
            run: {
              font: KDP_BODY_FONT,
              size: 28, // 14pt (half-points)
              bold: true,
              color: '000000',
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { before: 960, after: 480 }, // 48pt / 24pt (twentieths of a point)
              indent: { firstLine: 0 },
            },
          },
          heading2: {
            run: {
              font: KDP_BODY_FONT,
              size: 24, // 12pt
              bold: true,
              italics: true,
              color: '000000',
            },
            paragraph: {
              spacing: { before: 480, after: 240 },
              indent: { firstLine: 0 },
            },
          },
          heading3: {
            run: {
              font: KDP_BODY_FONT,
              size: 22, // 11pt
              bold: true,
              color: '000000',
            },
            paragraph: {
              spacing: { before: 360, after: 120 },
              indent: { firstLine: 0 },
            },
          },
        },
      };
    }

    // 'neutral': only override the colour of headings to black
    return {
      default: {
        heading1: { run: { color: '000000' } },
        heading2: { run: { color: '000000' } },
        heading3: { run: { color: '000000' } },
        heading4: { run: { color: '000000' } },
        heading5: { run: { color: '000000' } },
        heading6: { run: { color: '000000' } },
      },
    };
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

      // A4 dimensions: 8.27" × 11.69". Use 80% of page for the image.
      const pageWidthEmu = 8.27 * 914400;
      const pageHeightEmu = 11.69 * 914400;
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
   * Convert TipTap JSON document to an array of DOCX Paragraphs.
   * Tracks whether the previous node was a heading so the first body paragraph
   * after a chapter title has no first-line indent (typographic convention).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertTipTapToDocx(json: any, preset: DocxStylePreset): Paragraph[] {
    if (!json || !json.content) return [];

    const paragraphs: Paragraph[] = [];

    for (const node of json.content) {
      const paragraph = this.convertNode(node, preset);
      if (paragraph) {
        paragraphs.push(paragraph);
      }
    }

    return paragraphs;
  }

  /**
   * Convert a single TipTap node to a DOCX Paragraph.
   * @param isFirstAfterHeading - true when this paragraph immediately follows a heading
   *   (used by KDP preset to suppress first-line indent on the opening sentence)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertNode(node: any, preset: DocxStylePreset): Paragraph | null {
    if (node.type === 'paragraph') {
      const runs = this.convertTextNodes(node.content || [], preset);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = { children: runs };

      if (preset === 'kdp') {
        opts.alignment = AlignmentType.JUSTIFIED;
        opts.spacing = { line: KDP_LINE_SPACING, lineRule: 'auto' };
        opts.indent = { firstLine: KDP_FIRST_LINE_INDENT };
        // Respect explicit alignment set in the editor (e.g. centred epigraph)
        if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
          opts.alignment = this.convertAlignment(node.attrs.textAlign);
        }
      } else {
        if (node.attrs?.textAlign) {
          opts.alignment = this.convertAlignment(node.attrs.textAlign);
        }
        if (node.attrs?.indent) {
          opts.indent = { firstLine: 720 }; // 0.5" legacy indent
        }
      }

      return new Paragraph(opts);
    }

    if (node.type === 'heading') {
      const runs = this.convertTextNodes(node.content || [], preset);
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
   * In KDP mode, Garamond 11pt is applied as the base font/size unless the author
   * has explicitly set a different font or size via the textStyle mark.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertTextNodes(nodes: any[], preset: DocxStylePreset): TextRun[] {
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

      // KDP base font/size: apply only when the author has not set an explicit override
      if (preset === 'kdp') {
        if (!runOptions.font) runOptions.font = KDP_BODY_FONT;
        if (!runOptions.size) runOptions.size = 22; // 11pt
      }

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
