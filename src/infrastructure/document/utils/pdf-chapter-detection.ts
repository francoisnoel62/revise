// ABOUTME: Chapter detection strategies for PDF documents
// ABOUTME: Uses outline, font size heuristics, and word limit fallback

import type { PdfTextPage, PdfTextItem, PdfOutlineItem } from './pdf-text-extraction';
import { calculateMedianFontSize, countWordsInPages } from './pdf-text-extraction';
import { isShortLine } from './pdf-formatting';

/**
 * Maximum words per chapter when using fallback splitting
 */
export const MAX_WORDS_PER_CHAPTER = 5000;

/**
 * Represents a detected chapter boundary
 */
export interface ChapterBoundary {
  title: string;
  startPageIndex: number;
  startItemIndex: number;
  items: PdfTextItem[];
}

/**
 * Detect chapters from PDF outline/bookmarks (highest priority)
 * @param outline - PDF outline items
 * @param pages - Extracted PDF pages
 * @returns Array of chapter boundaries, or empty if no usable outline
 */
export function detectChaptersFromOutline(
  outline: PdfOutlineItem[],
  pages: PdfTextPage[]
): ChapterBoundary[] {
  if (!outline || outline.length === 0) return [];

  // Flatten outline to top-level items only (chapters)
  // We only use top-level outline items as chapter markers
  const chapters: ChapterBoundary[] = [];

  for (let i = 0; i < outline.length; i++) {
    const item = outline[i];
    const nextItem = outline[i + 1];

    const startPageIndex = item.pageNumber - 1; // Convert to 0-based
    const endPageIndex = nextItem ? nextItem.pageNumber - 1 : pages.length;

    // Collect all items from start page to end page
    const items: PdfTextItem[] = [];
    for (let p = startPageIndex; p < endPageIndex && p < pages.length; p++) {
      const page = pages[p];
      if (page) {
        items.push(...page.items);
      }
    }

    chapters.push({
      title: item.title || `Chapitre ${i + 1}`,
      startPageIndex,
      startItemIndex: 0,
      items,
    });
  }

  return chapters;
}

/**
 * Detect chapters from font size changes (medium priority)
 * Looks for text significantly larger than body text
 * @param pages - Extracted PDF pages
 * @returns Array of chapter boundaries, or empty if no headings found
 */
export function detectChaptersFromFontSize(pages: PdfTextPage[]): ChapterBoundary[] {
  const medianFontSize = calculateMedianFontSize(pages);
  const headingThreshold = medianFontSize * 1.5;

  const chapters: ChapterBoundary[] = [];
  let currentChapter: ChapterBoundary | null = null;
  let chapterIndex = 1;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];

    for (let itemIndex = 0; itemIndex < page.items.length; itemIndex++) {
      const item = page.items[itemIndex];

      // Check if this looks like a heading
      const isHeading =
        item.fontSize >= headingThreshold &&
        isShortLine(item.text) &&
        /^[A-ZÀ-ÿ\d]/.test(item.text.trim()); // Starts with capital or number

      if (isHeading) {
        // Save previous chapter
        if (currentChapter && currentChapter.items.length > 0) {
          chapters.push(currentChapter);
        }

        // Start new chapter
        currentChapter = {
          title: item.text.trim(),
          startPageIndex: pageIndex,
          startItemIndex: itemIndex,
          items: [],
        };
        chapterIndex++;
      } else if (currentChapter) {
        currentChapter.items.push(item);
      } else {
        // Content before first heading - start implicit chapter
        currentChapter = {
          title: '',
          startPageIndex: pageIndex,
          startItemIndex: itemIndex,
          items: [item],
        };
      }
    }
  }

  // Don't forget the last chapter
  if (currentChapter && currentChapter.items.length > 0) {
    chapters.push(currentChapter);
  }

  // If we only found 1 chapter and it has no title, return empty (trigger fallback)
  if (chapters.length === 1 && !chapters[0].title) {
    return [];
  }

  return chapters;
}

/**
 * Split document into chapters by word limit (fallback)
 * Creates chapters of approximately MAX_WORDS_PER_CHAPTER words each
 * @param pages - Extracted PDF pages
 * @param maxWords - Maximum words per chapter (default 5000)
 * @returns Array of chapter boundaries
 */
export function splitByWordLimit(
  pages: PdfTextPage[],
  maxWords: number = MAX_WORDS_PER_CHAPTER
): ChapterBoundary[] {
  const totalWords = countWordsInPages(pages);

  // If document is short enough, single chapter
  if (totalWords <= maxWords) {
    const allItems = pages.flatMap(p => p.items);
    return [{
      title: '',
      startPageIndex: 0,
      startItemIndex: 0,
      items: allItems,
    }];
  }

  const chapters: ChapterBoundary[] = [];
  let currentItems: PdfTextItem[] = [];
  let currentWordCount = 0;
  let chapterIndex = 1;
  let chapterStartPageIndex = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];

    for (const item of page.items) {
      const itemWords = item.text.trim().split(/\s+/).filter(w => w.length > 0).length;

      // Check if adding this item exceeds limit
      if (currentWordCount + itemWords > maxWords && currentItems.length > 0) {
        // Find natural break point
        const breakPoint = findNaturalBreak(currentItems);

        // Create chapter with items up to break point
        chapters.push({
          title: `Partie ${chapterIndex}`,
          startPageIndex: chapterStartPageIndex,
          startItemIndex: 0,
          items: currentItems.slice(0, breakPoint),
        });

        // Carry over remaining items
        const remaining = currentItems.slice(breakPoint);
        currentItems = [...remaining, item];
        currentWordCount = countItemWords(currentItems);
        chapterIndex++;
        chapterStartPageIndex = pageIndex;
      } else {
        currentItems.push(item);
        currentWordCount += itemWords;
      }
    }
  }

  // Don't forget the last chapter
  if (currentItems.length > 0) {
    chapters.push({
      title: `Partie ${chapterIndex}`,
      startPageIndex: chapterStartPageIndex,
      startItemIndex: 0,
      items: currentItems,
    });
  }

  return chapters;
}

/**
 * Find a natural break point in a list of text items
 * Prioritizes: paragraph breaks > sentence ends > clause ends > any space
 * @param items - Text items to find break point in
 * @returns Index to split at (items before this index go to current chapter)
 */
export function findNaturalBreak(items: PdfTextItem[]): number {
  if (items.length <= 1) return items.length;

  // Search backwards from the end for natural break points
  // Priority 1: Large vertical gap (paragraph break)
  for (let i = items.length - 1; i > items.length / 2; i--) {
    const current = items[i];
    const previous = items[i - 1];
    if (previous && current) {
      const yDiff = Math.abs(current.y - previous.y);
      if (yDiff > (current.height || 12) * 2) {
        return i;
      }
    }
  }

  // Priority 2: Sentence end (. ! ?)
  for (let i = items.length - 1; i > items.length / 2; i--) {
    const item = items[i];
    if (item && /[.!?]\s*$/.test(item.text)) {
      return i + 1;
    }
  }

  // Priority 3: Clause end (, ; :)
  for (let i = items.length - 1; i > items.length / 2; i--) {
    const item = items[i];
    if (item && /[,;:]\s*$/.test(item.text)) {
      return i + 1;
    }
  }

  // Priority 4: Any item ending with space (word boundary)
  for (let i = items.length - 1; i > items.length / 2; i--) {
    const item = items[i];
    if (item && /\s$/.test(item.text)) {
      return i + 1;
    }
  }

  // Fallback: split at 80% of items
  return Math.floor(items.length * 0.8);
}

/**
 * Count words in an array of text items
 */
function countItemWords(items: PdfTextItem[]): number {
  return items.reduce((sum, item) => {
    const words = item.text.trim().split(/\s+/).filter(w => w.length > 0);
    return sum + words.length;
  }, 0);
}

/**
 * Main chapter detection function with 3-tier strategy
 * @param pages - Extracted PDF pages
 * @param outline - PDF outline (may be empty)
 * @returns Array of chapter boundaries
 */
export function detectChapters(
  pages: PdfTextPage[],
  outline: PdfOutlineItem[]
): ChapterBoundary[] {
  // Strategy 1: PDF Outline (highest priority)
  const outlineChapters = detectChaptersFromOutline(outline, pages);
  if (outlineChapters.length > 0) {
    return outlineChapters;
  }

  // Strategy 2: Font size detection (medium priority)
  const fontSizeChapters = detectChaptersFromFontSize(pages);
  if (fontSizeChapters.length > 0) {
    return fontSizeChapters;
  }

  // Strategy 3: Word limit fallback (lowest priority)
  return splitByWordLimit(pages);
}
