// ABOUTME: PDF exporter with rich text formatting and multi-chapter support
// ABOUTME: Converts TipTap JSON to formatted PDF with typography preservation

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, RGB } from 'pdf-lib';
import { DocumentExporter, ExportOptions } from '@/domain/interfaces/DocumentExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

// PDF configuration matching A4 page styling from editor
const PDF_CONFIG = {
  page: {
    width: 595.28, // A4 in points (210mm)
    height: 841.89, // A4 in points (297mm)
  },
  margins: {
    top: 113.39, // 4cm in points
    bottom: 113.39, // 4cm in points
    left: 85.04, // 3cm in points
    right: 85.04, // 3cm in points
  },
  typography: {
    defaultSize: 13, // pt
    lineHeight: 1.5,
    paragraphSpacing: 0, // pt (no extra spacing between paragraphs)
    firstLineIndent: 36, // 1.27cm in points
    headingScale: {
      1: 2.0,
      2: 1.5,
      3: 1.25,
      4: 1.1,
      5: 1.0,
      6: 0.9,
    } as Record<number, number>,
  },
};

// Character mapping for non-WinAnsi characters to ASCII equivalents
// WinAnsi encoding only supports a subset of Unicode (Latin-1 + some extras)
const CHAR_REPLACEMENTS: Record<string, string> = {
  // Turkish characters
  'ı': 'i', // dotless i
  'İ': 'I', // dotted I
  'ş': 's',
  'Ş': 'S',
  'ğ': 'g',
  'Ğ': 'G',
  // Polish characters
  'ł': 'l',
  'Ł': 'L',
  'ą': 'a',
  'Ą': 'A',
  'ę': 'e',
  'Ę': 'E',
  'ć': 'c',
  'Ć': 'C',
  'ń': 'n',
  'Ń': 'N',
  'ś': 's',
  'Ś': 'S',
  'ź': 'z',
  'Ź': 'Z',
  'ż': 'z',
  'Ż': 'Z',
  // Czech/Slovak characters
  'ř': 'r',
  'Ř': 'R',
  'ě': 'e',
  'Ě': 'E',
  'ů': 'u',
  'Ů': 'U',
  'ď': 'd',
  'Ď': 'D',
  'ť': 't',
  'Ť': 'T',
  'ň': 'n',
  'Ň': 'N',
  // Romanian characters
  'ț': 't',
  'Ț': 'T',
  'ă': 'a',
  'Ă': 'A',
  // Hungarian characters
  'ő': 'o',
  'Ő': 'O',
  'ű': 'u',
  'Ű': 'U',
  // Icelandic/Nordic
  'ð': 'd',
  'Ð': 'D',
  'þ': 'th',
  'Þ': 'Th',
  // Greek (common letters)
  'α': 'a',
  'β': 'b',
  'γ': 'g',
  'δ': 'd',
  'ε': 'e',
  'π': 'pi',
  'Ω': 'O',
  // Special punctuation (using Unicode escapes for problematic characters)
  // NOTE: En dash (U+2013), em dash (U+2014), smart quotes (U+2018-U+201E),
  // and French guillemets (U+00AB, U+00BB) are preserved - they are supported
  // by WinAnsi encoding in pdf-lib StandardFonts
  '\u2026': '...', // ellipsis
  '\u2022': '*', // bullet
  '\u2192': '->', // right arrow
  '\u2190': '<-', // left arrow
  '\u2194': '<->', // left-right arrow
  '\u2260': '!=', // not equal
  '\u2264': '<=', // less than or equal
  '\u2265': '>=', // greater than or equal
  '\u00B1': '+/-', // plus-minus
  '\u00D7': 'x', // multiplication sign
  '\u00F7': '/', // division sign
  '\u221A': 'sqrt', // square root
  '\u221E': 'inf', // infinity
  '\u00B0': 'deg', // degree
  '\u00A9': '(c)', // copyright
  '\u00AE': '(R)', // registered
  '\u2122': '(TM)', // trademark
  '\u20AC': 'EUR', // euro
  '\u00A3': 'GBP', // pound
  '\u00A5': 'JPY', // yen
};

/**
 * Normalize text to WinAnsi-compatible characters.
 * Replaces unsupported Unicode characters with ASCII equivalents.
 */
function normalizeForWinAnsi(text: string): string {
  let result = '';
  for (const char of text) {
    if (CHAR_REPLACEMENTS[char]) {
      result += CHAR_REPLACEMENTS[char];
    } else {
      // Check if character is in WinAnsi range (basic Latin + Latin-1 Supplement)
      const code = char.charCodeAt(0);
      // WinAnsi supports:
      // - 0-255: Basic Latin, Latin-1 (includes French guillemets « » at 171, 187)
      // - 0x2013-0x2014: En dash (–) and em dash (—)
      // - 0x2018-0x201E: Smart quotes (' ' " " „)
      if (
        code <= 255 ||
        (code >= 0x2013 && code <= 0x2014) ||
        (code >= 0x2018 && code <= 0x201e)
      ) {
        result += char;
      } else {
        // Unknown character - replace with placeholder or skip
        result += '?';
      }
    }
  }
  return result;
}

// Highlight color mapping from Tailwind to RGB
const HIGHLIGHT_COLORS: Record<string, RGB> = {
  '#fbbf24': rgb(0.98, 0.75, 0.14), // Yellow (Tailwind amber-400)
  '#fef08a': rgb(0.996, 0.941, 0.541), // Light yellow
  '#bef264': rgb(0.745, 0.949, 0.392), // Green
  '#86efac': rgb(0.525, 0.937, 0.675), // Light green
  '#93c5fd': rgb(0.576, 0.773, 0.992), // Blue
  '#c4b5fd': rgb(0.769, 0.71, 0.992), // Purple
  '#fca5a5': rgb(0.988, 0.647, 0.647), // Red
};

// TipTap node types
interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapTextNode {
  type: 'text';
  text: string;
  marks?: TipTapMark[];
}

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TipTapMark[];
}

interface TipTapDocument {
  type: 'doc';
  content?: TipTapNode[];
}

// Text run with styling
interface TextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlightColor?: RGB;
  fontSize?: number;
}

// A word with its styling information
interface StyledWord {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlightColor?: RGB;
  fontSize?: number;
}

// Font set for different styles
interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

// Render context for page state
interface RenderContext {
  pdfDoc: PDFDocument;
  currentPage: PDFPage;
  fonts: FontSet;
  yPosition: number;
  contentWidth: number;
}

export class PdfExporter implements DocumentExporter {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  async export(content: string, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const fonts = await this.loadFonts(pdfDoc);

      const page = pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);
      const contentWidth =
        PDF_CONFIG.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;

      const context: RenderContext = {
        pdfDoc,
        currentPage: page,
        fonts,
        yPosition: PDF_CONFIG.page.height - PDF_CONFIG.margins.top,
        contentWidth,
      };

      // Split content into paragraphs and render
      const paragraphs = content.split(/\n+/).filter((p) => p.trim());
      for (const paragraph of paragraphs) {
        this.renderPlainTextParagraph(context, paragraph);
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export PDF: ${error.message}`);
      }
      throw new Error('Failed to export PDF file');
    }
  }

  async exportProject(project: Project, filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const fonts = await this.loadFonts(pdfDoc);
      const chapters = project.getChapters();
      const contentWidth =
        PDF_CONFIG.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;

      // Add cover page if cover image is provided
      if (options?.coverImageUrl) {
        await this.addCoverPage(pdfDoc, options.coverImageUrl);
      }

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Create new page for each chapter
        const page = pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);

        const context: RenderContext = {
          pdfDoc,
          currentPage: page,
          fonts,
          yPosition: PDF_CONFIG.page.height - PDF_CONFIG.margins.top,
          contentWidth,
        };

        // Render chapter title as H1
        this.renderHeading(context, chapter.getTitle(), 1);

        // Parse and render TipTap content
        const json = JSON.parse(chapter.getContent()) as TipTapDocument;
        this.renderTipTapDocument(context, json);
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
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
      const pdfDoc = await PDFDocument.create();
      const fonts = await this.loadFonts(pdfDoc);

      // Add cover page if cover image is provided
      if (options?.coverImageUrl) {
        await this.addCoverPage(pdfDoc, options.coverImageUrl);
      }

      const page = pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);
      const contentWidth =
        PDF_CONFIG.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;

      const context: RenderContext = {
        pdfDoc,
        currentPage: page,
        fonts,
        yPosition: PDF_CONFIG.page.height - PDF_CONFIG.margins.top,
        contentWidth,
      };

      // Render chapter title
      this.renderHeading(context, chapter.getTitle(), 1);

      // Parse and render content
      const json = JSON.parse(chapter.getContent()) as TipTapDocument;
      this.renderTipTapDocument(context, json);

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
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
      const pdfDoc = await PDFDocument.create();
      const fonts = await this.loadFonts(pdfDoc);
      const contentWidth =
        PDF_CONFIG.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;

      // Add cover page if cover image is provided
      if (options?.coverImageUrl) {
        await this.addCoverPage(pdfDoc, options.coverImageUrl);
      }

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Create new page for each chapter
        const page = pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);

        const context: RenderContext = {
          pdfDoc,
          currentPage: page,
          fonts,
          yPosition: PDF_CONFIG.page.height - PDF_CONFIG.margins.top,
          contentWidth,
        };

        // Render chapter title as H1
        this.renderHeading(context, chapter.getTitle(), 1);

        // Parse and render TipTap content
        const json = JSON.parse(chapter.getContent()) as TipTapDocument;
        this.renderTipTapDocument(context, json);
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export chapters: ${error.message}`);
      }
      throw new Error('Failed to export chapters');
    }
  }

  private async loadFonts(pdfDoc: PDFDocument): Promise<FontSet> {
    // Use Times Roman (closest to Times New Roman / Georgia in standard fonts)
    const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const boldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    return { regular, bold, italic, boldItalic };
  }

  private async addCoverPage(pdfDoc: PDFDocument, coverImageUrl: string): Promise<void> {
    try {
      // Fetch the image from URL
      const response = await fetch(coverImageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch cover image: ${response.status}`);
        return;
      }

      const imageBuffer = await response.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);

      // Detect image type from URL or content-type header
      const contentType = response.headers.get('content-type') || '';
      let image;

      if (contentType.includes('png') || coverImageUrl.toLowerCase().endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (
        contentType.includes('jpeg') ||
        contentType.includes('jpg') ||
        coverImageUrl.toLowerCase().endsWith('.jpg') ||
        coverImageUrl.toLowerCase().endsWith('.jpeg')
      ) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Try to detect from magic bytes
        if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
      }

      // Create a cover page
      const coverPage = pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);

      // Calculate dimensions to fit the image on the page while maintaining aspect ratio
      const imageAspectRatio = image.width / image.height;
      const pageAspectRatio = PDF_CONFIG.page.width / PDF_CONFIG.page.height;

      let drawWidth: number;
      let drawHeight: number;

      if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page proportionally - fit to width
        drawWidth = PDF_CONFIG.page.width;
        drawHeight = drawWidth / imageAspectRatio;
      } else {
        // Image is taller than page proportionally - fit to height
        drawHeight = PDF_CONFIG.page.height;
        drawWidth = drawHeight * imageAspectRatio;
      }

      // Center the image on the page
      const x = (PDF_CONFIG.page.width - drawWidth) / 2;
      const y = (PDF_CONFIG.page.height - drawHeight) / 2;

      coverPage.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    } catch (error) {
      // Log error but don't fail the export if cover image fails
      console.warn('Failed to add cover image to PDF:', error);
    }
  }

  private getFont(fonts: FontSet, bold: boolean, italic: boolean): PDFFont {
    if (bold && italic) return fonts.boldItalic;
    if (bold) return fonts.bold;
    if (italic) return fonts.italic;
    return fonts.regular;
  }

  private renderTipTapDocument(context: RenderContext, json: TipTapDocument): void {
    if (!json || !json.content) return;

    for (const node of json.content) {
      this.renderNode(context, node);
    }
  }

  private renderNode(context: RenderContext, node: TipTapNode): void {
    switch (node.type) {
      case 'paragraph':
        this.renderParagraph(context, node);
        break;
      case 'heading':
        this.renderHeadingNode(context, node);
        break;
      case 'bulletList':
      case 'orderedList':
        // TODO: Implement list handling
        break;
    }
  }

  private renderParagraph(context: RenderContext, node: TipTapNode): void {
    const runs = this.extractTextRuns(node.content || []);
    const alignment = (node.attrs?.textAlign as string) || 'justify';
    const hasIndent = node.attrs?.indent === true;

    this.renderTextBlock(context, runs, PDF_CONFIG.typography.defaultSize, alignment, hasIndent);

    // Add paragraph spacing
    context.yPosition -= PDF_CONFIG.typography.paragraphSpacing;
  }

  private renderHeadingNode(context: RenderContext, node: TipTapNode): void {
    const level = (node.attrs?.level as number) || 1;
    const text = this.extractPlainText(node.content || []);
    this.renderHeading(context, text, level);
  }

  private renderHeading(context: RenderContext, text: string, level: number): void {
    const scale = PDF_CONFIG.typography.headingScale[level] || 1;
    const fontSize = PDF_CONFIG.typography.defaultSize * scale;

    // Add extra space before heading
    context.yPosition -= fontSize * 0.5;

    // Check if we need a new page
    this.ensureSpace(context, fontSize * 2);

    const font = context.fonts.bold;
    const normalizedText = normalizeForWinAnsi(text);
    const textWidth = font.widthOfTextAtSize(normalizedText, fontSize);

    // Center headings
    const x = PDF_CONFIG.margins.left + (context.contentWidth - textWidth) / 2;

    context.currentPage.drawText(normalizedText, {
      x,
      y: context.yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    context.yPosition -= fontSize * PDF_CONFIG.typography.lineHeight;
    context.yPosition -= PDF_CONFIG.typography.paragraphSpacing;
  }

  private renderTextBlock(
    context: RenderContext,
    runs: TextRun[],
    fontSize: number,
    alignment: string,
    hasIndent: boolean
  ): void {
    if (runs.length === 0) {
      context.yPosition -= fontSize * PDF_CONFIG.typography.lineHeight;
      return;
    }

    // Convert runs to styled words for proper justification
    const styledWords = this.extractStyledWords(runs, fontSize);
    if (styledWords.length === 0) {
      context.yPosition -= fontSize * PDF_CONFIG.typography.lineHeight;
      return;
    }

    // Wrap styled words into lines
    const lines = this.wrapStyledWords(context, styledWords, fontSize, hasIndent);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineWords = lines[lineIndex];
      const isFirstLine = lineIndex === 0;
      const isLastLine = lineIndex === lines.length - 1;

      this.ensureSpace(context, fontSize * PDF_CONFIG.typography.lineHeight);

      // Calculate line starting x position
      let x = PDF_CONFIG.margins.left;
      if (isFirstLine && hasIndent) {
        x += PDF_CONFIG.typography.firstLineIndent;
      }

      // Calculate total width of words (without spaces)
      let totalWordsWidth = 0;
      for (const word of lineWords) {
        const font = this.getFont(context.fonts, word.bold, word.italic);
        const effectiveFontSize = word.fontSize || fontSize;
        totalWordsWidth += font.widthOfTextAtSize(normalizeForWinAnsi(word.text), effectiveFontSize);
      }

      // Calculate available width and spacing
      const availableWidth =
        context.contentWidth - (isFirstLine && hasIndent ? PDF_CONFIG.typography.firstLineIndent : 0);
      const numGaps = lineWords.length - 1;

      // Calculate space width between words
      let spaceWidth = context.fonts.regular.widthOfTextAtSize(' ', fontSize);
      if (alignment === 'justify' && !isLastLine && numGaps > 0) {
        // Distribute remaining space evenly between words
        spaceWidth = (availableWidth - totalWordsWidth) / numGaps;
      }

      // Adjust starting x for center/right alignment
      if (alignment === 'center') {
        const lineWidth = totalWordsWidth + numGaps * spaceWidth;
        x += (availableWidth - lineWidth) / 2;
      } else if (alignment === 'right') {
        const lineWidth = totalWordsWidth + numGaps * spaceWidth;
        x += availableWidth - lineWidth;
      }

      // Render each word
      for (let wordIndex = 0; wordIndex < lineWords.length; wordIndex++) {
        const word = lineWords[wordIndex];
        const font = this.getFont(context.fonts, word.bold, word.italic);
        const effectiveFontSize = word.fontSize || fontSize;
        const normalizedText = normalizeForWinAnsi(word.text);
        const textWidth = font.widthOfTextAtSize(normalizedText, effectiveFontSize);

        // Draw highlight background if present
        if (word.highlightColor) {
          context.currentPage.drawRectangle({
            x,
            y: context.yPosition - effectiveFontSize * 0.2,
            width: textWidth,
            height: effectiveFontSize * 1.2,
            color: word.highlightColor,
          });
        }

        // Draw text
        context.currentPage.drawText(normalizedText, {
          x,
          y: context.yPosition,
          size: effectiveFontSize,
          font,
          color: rgb(0, 0, 0),
        });

        // Draw underline if present
        if (word.underline) {
          context.currentPage.drawLine({
            start: { x, y: context.yPosition - 2 },
            end: { x: x + textWidth, y: context.yPosition - 2 },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }

        // Advance x position
        x += textWidth;

        // Add space after word (except for last word)
        if (wordIndex < lineWords.length - 1) {
          x += spaceWidth;
        }
      }

      context.yPosition -= fontSize * PDF_CONFIG.typography.lineHeight;
    }
  }

  private extractStyledWords(runs: TextRun[], defaultFontSize: number): StyledWord[] {
    const words: StyledWord[] = [];

    for (const run of runs) {
      // Split run text into words
      const runWords = run.text.split(/\s+/).filter((w) => w.length > 0);

      for (const wordText of runWords) {
        words.push({
          text: wordText,
          bold: run.bold,
          italic: run.italic,
          underline: run.underline,
          highlightColor: run.highlightColor,
          fontSize: run.fontSize || defaultFontSize,
        });
      }
    }

    return words;
  }

  private wrapStyledWords(
    context: RenderContext,
    words: StyledWord[],
    fontSize: number,
    hasFirstLineIndent: boolean
  ): StyledWord[][] {
    const lines: StyledWord[][] = [];
    let currentLine: StyledWord[] = [];
    let currentLineWidth = 0;
    let isFirstLine = true;
    const spaceWidth = context.fonts.regular.widthOfTextAtSize(' ', fontSize);

    for (const word of words) {
      const font = this.getFont(context.fonts, word.bold, word.italic);
      const effectiveFontSize = word.fontSize || fontSize;
      const wordWidth = font.widthOfTextAtSize(normalizeForWinAnsi(word.text), effectiveFontSize);

      const maxWidth =
        context.contentWidth -
        (isFirstLine && hasFirstLineIndent ? PDF_CONFIG.typography.firstLineIndent : 0);

      // Check if word fits on current line
      const widthWithWord =
        currentLine.length === 0 ? wordWidth : currentLineWidth + spaceWidth + wordWidth;

      if (widthWithWord > maxWidth && currentLine.length > 0) {
        // Start new line
        lines.push(currentLine);
        currentLine = [word];
        currentLineWidth = wordWidth;
        isFirstLine = false;
      } else {
        // Add word to current line
        currentLine.push(word);
        currentLineWidth = widthWithWord;
      }
    }

    // Don't forget the last line
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [[]];
  }

  private renderPlainTextParagraph(context: RenderContext, text: string): void {
    const runs: TextRun[] = [
      {
        text,
        bold: false,
        italic: false,
        underline: false,
      },
    ];
    this.renderTextBlock(context, runs, PDF_CONFIG.typography.defaultSize, 'left', false);
    context.yPosition -= PDF_CONFIG.typography.paragraphSpacing;
  }

  private extractTextRuns(nodes: TipTapNode[]): TextRun[] {
    const runs: TextRun[] = [];

    for (const node of nodes) {
      if (node.type !== 'text' || !node.text) continue;

      const textNode = node as unknown as TipTapTextNode;
      const marks = textNode.marks || [];

      const run: TextRun = {
        text: textNode.text,
        bold: marks.some((m) => m.type === 'bold'),
        italic: marks.some((m) => m.type === 'italic'),
        underline: marks.some((m) => m.type === 'underline'),
      };

      // Check for highlight
      const highlightMark = marks.find((m) => m.type === 'highlight');
      if (highlightMark?.attrs?.color) {
        const colorKey = highlightMark.attrs.color as string;
        run.highlightColor = HIGHLIGHT_COLORS[colorKey] || rgb(1, 1, 0);
      }

      // Check for font size from textStyle
      const textStyleMark = marks.find((m) => m.type === 'textStyle');
      if (textStyleMark?.attrs?.fontSize) {
        const ptValue = parseInt(textStyleMark.attrs.fontSize as string);
        if (!isNaN(ptValue)) {
          run.fontSize = ptValue;
        }
      }

      runs.push(run);
    }

    return runs;
  }

  private extractPlainText(nodes: TipTapNode[]): string {
    return nodes
      .filter((n) => n.type === 'text')
      .map((n) => n.text || '')
      .join('');
  }

  private ensureSpace(context: RenderContext, neededHeight: number): void {
    const bottomLimit = PDF_CONFIG.margins.bottom;

    if (context.yPosition - neededHeight < bottomLimit) {
      // Add new page
      const newPage = context.pdfDoc.addPage([PDF_CONFIG.page.width, PDF_CONFIG.page.height]);
      context.currentPage = newPage;
      context.yPosition = PDF_CONFIG.page.height - PDF_CONFIG.margins.top;
    }
  }
}
