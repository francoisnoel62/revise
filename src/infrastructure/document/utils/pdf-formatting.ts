// ABOUTME: Converts PDF font information to TipTap marks and nodes
// ABOUTME: Handles font name parsing and heading detection from font sizes

import type { PdfTextItem } from './pdf-text-extraction';

/**
 * Parsed font information
 */
export interface FontInfo {
  family: string;
  bold: boolean;
  italic: boolean;
}

/**
 * TipTap mark structure
 */
export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Parse font name to extract style information
 * PDF fonts often have names like "BCDEF+Arial-BoldItalic" or "TimesNewRoman,Bold"
 * @param fontName - Raw font name from PDF
 * @returns Parsed font information
 */
export function parseFontName(fontName: string): FontInfo {
  if (!fontName) {
    return { family: 'serif', bold: false, italic: false };
  }

  // Remove subset prefix (e.g., "BCDEF+" or "AAAAAA+")
  let normalized = fontName.replace(/^[A-Z]{6}\+/, '');

  // Detect bold
  const bold = /Bold|Black|Heavy|Demi|Semibold/i.test(normalized);

  // Detect italic
  const italic = /Italic|Oblique|Inclined/i.test(normalized);

  // Extract base family name
  let family = normalized
    // Remove style suffixes
    .replace(/[-,](Bold|Italic|BoldItalic|Regular|Black|Heavy|Light|Medium|Thin|Oblique|Inclined|Semibold|Demi|MT|PS)*/gi, '')
    // Remove remaining punctuation
    .replace(/[-_,]/g, '')
    .trim();

  // Normalize common font families
  if (/Times/i.test(family)) {
    family = 'Times New Roman';
  } else if (/Arial|Helvetica/i.test(family)) {
    family = 'Arial';
  } else if (/Georgia/i.test(family)) {
    family = 'Georgia';
  } else if (/Courier/i.test(family)) {
    family = 'Courier New';
  } else if (!family) {
    family = 'serif';
  }

  return { family, bold, italic };
}

/**
 * Convert font info to TipTap marks array
 * @param fontInfo - Parsed font information
 * @param includeFontFamily - Whether to include font family mark
 * @returns Array of TipTap marks
 */
export function fontInfoToMarks(fontInfo: FontInfo, includeFontFamily = false): TipTapMark[] {
  const marks: TipTapMark[] = [];

  if (fontInfo.bold) {
    marks.push({ type: 'bold' });
  }

  if (fontInfo.italic) {
    marks.push({ type: 'italic' });
  }

  if (includeFontFamily && fontInfo.family && fontInfo.family !== 'serif') {
    marks.push({
      type: 'textStyle',
      attrs: { fontFamily: fontInfo.family },
    });
  }

  return marks;
}

/**
 * Convert font size to TipTap fontSize mark
 * @param fontSize - Font size in PDF points
 * @returns TipTap textStyle mark with fontSize, or null if default size
 */
export function fontSizeToMark(fontSize: number): TipTapMark | null {
  // Common font sizes in pt - map to our supported sizes
  // PDF uses points, we store as "Xpt" strings
  const roundedSize = Math.round(fontSize);

  // Only include non-default sizes (default is 13pt)
  if (roundedSize >= 10 && roundedSize <= 18 && roundedSize !== 13) {
    return {
      type: 'textStyle',
      attrs: { fontSize: `${roundedSize}pt` },
    };
  }

  return null;
}

/**
 * Detect if a text item is likely a heading based on font size
 * @param fontSize - Font size of the text item
 * @param medianFontSize - Median font size in the document
 * @param isShortLine - Whether the line is short (not a paragraph)
 * @returns Heading level (1-3) or null if not a heading
 */
export function detectHeadingLevel(
  fontSize: number,
  medianFontSize: number,
  isShortLine: boolean
): number | null {
  if (!isShortLine) return null;

  const ratio = fontSize / medianFontSize;

  // Heading 1: >= 200% of body text
  if (ratio >= 2.0) return 1;

  // Heading 2: >= 150% of body text
  if (ratio >= 1.5) return 2;

  // Heading 3: >= 130% of body text
  if (ratio >= 1.3) return 3;

  return null;
}

/**
 * Check if a text item represents a short line (potential heading)
 * @param text - The text content
 * @param maxChars - Maximum characters for a "short" line
 * @returns true if the line is short
 */
export function isShortLine(text: string, maxChars = 100): boolean {
  return text.trim().length < maxChars;
}

/**
 * Group consecutive text items into paragraphs based on vertical position
 * @param items - Array of text items from a page
 * @param lineThreshold - Vertical gap to consider a new paragraph
 * @returns Array of paragraph groups
 */
export function groupIntoParagraphs(
  items: PdfTextItem[],
  lineThreshold = 5
): PdfTextItem[][] {
  if (items.length === 0) return [];

  const paragraphs: PdfTextItem[][] = [];
  let currentParagraph: PdfTextItem[] = [];
  let lastY = items[0]?.y ?? 0;

  for (const item of items) {
    // Large vertical gap indicates new paragraph
    const yDiff = Math.abs(item.y - lastY);

    if (yDiff > item.height * 1.5 && currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    }

    currentParagraph.push(item);
    lastY = item.y;
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

/**
 * Build TipTap paragraph node from text items
 * @param items - Text items forming a paragraph
 * @param medianFontSize - Median font size for heading detection
 * @returns TipTap node (paragraph or heading)
 */
export function buildTipTapNode(
  items: PdfTextItem[],
  medianFontSize: number
): Record<string, unknown> {
  if (items.length === 0) {
    return {
      type: 'paragraph',
      content: [],
    };
  }

  // Combine text and check for heading
  const fullText = items.map(i => i.text).join('');
  const avgFontSize = items.reduce((sum, i) => sum + i.fontSize, 0) / items.length;
  const headingLevel = detectHeadingLevel(avgFontSize, medianFontSize, isShortLine(fullText));

  // Build content array with formatting
  const content: Record<string, unknown>[] = [];

  for (const item of items) {
    const fontInfo = parseFontName(item.fontName);
    const marks = fontInfoToMarks(fontInfo);
    const sizeMark = fontSizeToMark(item.fontSize);

    if (sizeMark && !headingLevel) {
      // Merge size mark with existing textStyle mark if present
      const existingTextStyle = marks.find(m => m.type === 'textStyle');
      if (existingTextStyle) {
        existingTextStyle.attrs = { ...existingTextStyle.attrs, ...sizeMark.attrs };
      } else {
        marks.push(sizeMark);
      }
    }

    const textNode: Record<string, unknown> = {
      type: 'text',
      text: item.text,
    };

    if (marks.length > 0) {
      textNode.marks = marks;
    }

    content.push(textNode);
  }

  // Return heading or paragraph
  if (headingLevel) {
    return {
      type: 'heading',
      attrs: { level: headingLevel },
      content,
    };
  }

  return {
    type: 'paragraph',
    content,
  };
}
