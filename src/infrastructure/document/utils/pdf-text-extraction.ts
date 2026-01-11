// ABOUTME: Low-level PDF text extraction utilities using unpdf/pdf.js
// ABOUTME: Extracts text content with font information and position data

import { getDocumentProxy } from 'unpdf';

/**
 * PDF.js TextItem structure (defined locally to avoid pdfjs-dist type dependency)
 */
interface PdfJsTextItem {
  str: string;
  fontName?: string;
  height?: number;
  width: number;
  transform: number[];
}

/**
 * Represents a single text item extracted from PDF
 */
export interface PdfTextItem {
  text: string;
  fontName: string;
  fontSize: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a page of extracted text
 */
export interface PdfTextPage {
  pageNumber: number;
  items: PdfTextItem[];
  width: number;
  height: number;
}

/**
 * Represents a PDF outline/bookmark item
 */
export interface PdfOutlineItem {
  title: string;
  pageNumber: number;
  children: PdfOutlineItem[];
}

/**
 * Extract text with formatting information from a PDF buffer
 * @param buffer - PDF file as Buffer
 * @returns Array of pages with text items
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfTextPage[]> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);
  const pages: PdfTextPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: PdfTextItem[] = [];

    for (const item of textContent.items) {
      // Type guard: only process text items, not marked content items
      if (!('str' in item)) continue;

      const textItem = item as PdfJsTextItem;
      if (!textItem.str.trim()) continue;

      items.push({
        text: textItem.str,
        fontName: textItem.fontName || '',
        fontSize: textItem.height || 12,
        x: textItem.transform[4],
        y: textItem.transform[5],
        width: textItem.width,
        height: textItem.height,
      });
    }

    pages.push({
      pageNumber: i,
      items,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

/**
 * Extract PDF outline/bookmarks (table of contents)
 * @param buffer - PDF file as Buffer
 * @returns Array of outline items with page numbers
 */
export async function getPdfOutline(buffer: Buffer): Promise<PdfOutlineItem[]> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);

  const outline = await pdf.getOutline();
  if (!outline) return [];

  // Helper to recursively process outline items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function processOutlineItem(item: any): Promise<PdfOutlineItem> {
    let pageNumber = 1;

    // Get destination page number
    if (item.dest) {
      try {
        const dest = typeof item.dest === 'string'
          ? await pdf.getDestination(item.dest)
          : item.dest;

        if (dest && dest[0]) {
          const pageRef = dest[0];
          const pageIndex = await pdf.getPageIndex(pageRef);
          pageNumber = pageIndex + 1;
        }
      } catch {
        // If destination resolution fails, keep default page 1
      }
    }

    const children: PdfOutlineItem[] = [];
    if (item.items && Array.isArray(item.items)) {
      for (const child of item.items) {
        children.push(await processOutlineItem(child));
      }
    }

    return {
      title: item.title || '',
      pageNumber,
      children,
    };
  }

  const result: PdfOutlineItem[] = [];
  for (const item of outline) {
    result.push(await processOutlineItem(item));
  }

  return result;
}

/**
 * Check if a PDF appears to be scanned (no extractable text)
 * @param buffer - PDF file as Buffer
 * @returns true if the PDF has no extractable text
 */
export async function isPdfScanned(buffer: Buffer): Promise<boolean> {
  const pages = await extractPdfText(buffer);
  const totalTextItems = pages.reduce((sum, page) => sum + page.items.length, 0);
  return totalTextItems === 0;
}

/**
 * Count total words across all pages
 * @param pages - Array of PDF text pages
 * @returns Total word count
 */
export function countWordsInPages(pages: PdfTextPage[]): number {
  let totalWords = 0;

  for (const page of pages) {
    for (const item of page.items) {
      const words = item.text.trim().split(/\s+/).filter(w => w.length > 0);
      totalWords += words.length;
    }
  }

  return totalWords;
}

/**
 * Calculate median font size from all text items
 * @param pages - Array of PDF text pages
 * @returns Median font size (for detecting headings)
 */
export function calculateMedianFontSize(pages: PdfTextPage[]): number {
  const fontSizes: number[] = [];

  for (const page of pages) {
    for (const item of page.items) {
      if (item.fontSize > 0) {
        fontSizes.push(item.fontSize);
      }
    }
  }

  if (fontSizes.length === 0) return 12; // Default font size

  fontSizes.sort((a, b) => a - b);
  const mid = Math.floor(fontSizes.length / 2);

  if (fontSizes.length % 2 === 0) {
    return (fontSizes[mid - 1] + fontSizes[mid]) / 2;
  }

  return fontSizes[mid];
}
