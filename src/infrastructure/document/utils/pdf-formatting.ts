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
 * Sort text items by position (top to bottom, left to right)
 * PDF coordinate system has Y=0 at bottom, so we sort by -Y (descending)
 */
export function sortItemsByPosition(items: PdfTextItem[]): PdfTextItem[] {
  return [...items].sort((a, b) => {
    // First sort by Y (top to bottom, so higher Y values first in PDF coords)
    // Use a tolerance for items on the same line
    const yTolerance = Math.min(a.height, b.height) * 0.5;
    if (Math.abs(a.y - b.y) > yTolerance) {
      return b.y - a.y; // Higher Y = higher on page in PDF
    }
    // Then sort by X (left to right)
    return a.x - b.x;
  });
}

/**
 * Group items into lines based on Y position
 * Items with similar Y values are on the same line
 */
export function groupIntoLines(items: PdfTextItem[]): PdfTextItem[][] {
  if (items.length === 0) return [];

  const sorted = sortItemsByPosition(items);
  const lines: PdfTextItem[][] = [];
  let currentLine: PdfTextItem[] = [];
  let currentY = sorted[0]?.y ?? 0;

  for (const item of sorted) {
    const yTolerance = item.height * 0.5;

    if (Math.abs(item.y - currentY) > yTolerance && currentLine.length > 0) {
      // New line
      lines.push(currentLine);
      currentLine = [];
      currentY = item.y;
    }

    currentLine.push(item);
  }

  // Don't forget the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Join items in a line with appropriate spacing
 * Detects gaps between items to add spaces
 */
export function joinLineItems(items: PdfTextItem[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].text;

  // Sort by X position (left to right)
  const sorted = [...items].sort((a, b) => a.x - b.x);

  let result = sorted[0].text;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Calculate expected position after previous item
    const expectedX = prev.x + prev.width;
    const gap = curr.x - expectedX;

    // If there's a significant gap, add a space
    // Use average character width as threshold
    const avgCharWidth = prev.width / Math.max(prev.text.length, 1);

    if (gap > avgCharWidth * 0.3) {
      result += ' ';
    }

    result += curr.text;
  }

  return result;
}

/**
 * Group consecutive text items into paragraphs based on vertical position
 * First groups into lines, then groups lines into paragraphs
 * @param items - Array of text items from a page
 * @returns Array of paragraph groups
 */
export function groupIntoParagraphs(
  items: PdfTextItem[],
  _lineThreshold = 5
): PdfTextItem[][] {
  if (items.length === 0) return [];

  // First group into lines
  const lines = groupIntoLines(items);
  if (lines.length === 0) return [];

  // Then group lines into paragraphs
  // A new paragraph starts when there's a larger gap between lines
  const paragraphs: PdfTextItem[][] = [];
  let currentParagraph: PdfTextItem[] = [];
  let lastLineY = lines[0]?.[0]?.y ?? 0;
  let lastLineHeight = lines[0]?.[0]?.height ?? 12;

  for (const line of lines) {
    if (line.length === 0) continue;

    const lineY = line[0].y;
    const lineHeight = line[0].height;
    const yGap = Math.abs(lastLineY - lineY);

    // Normal line spacing is about 1.2-1.5x the font height
    // A paragraph break is typically 2x or more
    const normalLineSpacing = lastLineHeight * 1.5;
    const paragraphBreakThreshold = lastLineHeight * 2.2;

    if (yGap > paragraphBreakThreshold && currentParagraph.length > 0) {
      // Paragraph break detected
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    }

    currentParagraph.push(...line);
    lastLineY = lineY;
    lastLineHeight = lineHeight;
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

/**
 * Build TipTap paragraph node from text items
 * Groups items into lines, joins with proper spacing
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

  // Group items into lines first
  const lines = groupIntoLines(items);

  // Build full text for heading detection
  const lineTexts = lines.map(line => joinLineItems(line));
  const fullText = lineTexts.join(' ');

  const avgFontSize = items.reduce((sum, i) => sum + i.fontSize, 0) / items.length;
  const headingLevel = detectHeadingLevel(avgFontSize, medianFontSize, isShortLine(fullText));

  // Build content array with formatting
  // Group consecutive items with same formatting
  const content: Record<string, unknown>[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineText = joinLineItems(line);

    if (lineText.trim()) {
      // Get formatting from first item of line (simplified approach)
      const firstItem = line[0];
      const fontInfo = parseFontName(firstItem.fontName);
      const marks = fontInfoToMarks(fontInfo);
      const sizeMark = fontSizeToMark(firstItem.fontSize);

      if (sizeMark && !headingLevel) {
        const existingTextStyle = marks.find(m => m.type === 'textStyle');
        if (existingTextStyle) {
          existingTextStyle.attrs = { ...existingTextStyle.attrs, ...sizeMark.attrs };
        } else {
          marks.push(sizeMark);
        }
      }

      const textNode: Record<string, unknown> = {
        type: 'text',
        text: lineText,
      };

      if (marks.length > 0) {
        textNode.marks = marks;
      }

      content.push(textNode);

      // Add space between lines (not hardBreak, as it's same paragraph)
      if (lineIndex < lines.length - 1) {
        content.push({ type: 'text', text: ' ' });
      }
    }
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
