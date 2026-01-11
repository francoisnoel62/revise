// ABOUTME: Tests for PDF chapter detection utilities
// ABOUTME: Tests outline-based, font-based, and word-limit chapter detection

import { describe, it, expect } from 'vitest';
import {
  detectChaptersFromOutline,
  detectChaptersFromFontSize,
  splitByWordLimit,
  findNaturalBreak,
  detectChapters,
  MAX_WORDS_PER_CHAPTER,
} from './pdf-chapter-detection';
import type { PdfTextPage, PdfOutlineItem, PdfTextItem } from './pdf-text-extraction';

describe('pdf-chapter-detection', () => {
  // Helper to create a text item
  const createItem = (text: string, fontSize = 12, y = 100): PdfTextItem => ({
    text,
    fontName: 'Arial',
    fontSize,
    x: 0,
    y,
    width: text.length * 6,
    height: fontSize,
  });

  // Helper to create a page
  const createPage = (items: PdfTextItem[], pageNumber = 1): PdfTextPage => ({
    pageNumber,
    items,
    width: 612,
    height: 792,
  });

  describe('detectChaptersFromOutline', () => {
    it('should return empty array for empty outline', () => {
      const pages: PdfTextPage[] = [createPage([createItem('Some text')])];
      expect(detectChaptersFromOutline([], pages)).toEqual([]);
    });

    it('should create chapters from outline items', () => {
      const outline: PdfOutlineItem[] = [
        { title: 'Chapter 1', pageNumber: 1, children: [] },
        { title: 'Chapter 2', pageNumber: 2, children: [] },
      ];

      const pages: PdfTextPage[] = [
        createPage([createItem('Chapter 1 content')], 1),
        createPage([createItem('Chapter 2 content')], 2),
      ];

      const chapters = detectChaptersFromOutline(outline, pages);

      expect(chapters.length).toBe(2);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[1].title).toBe('Chapter 2');
    });

    it('should use default title when outline item has no title', () => {
      const outline: PdfOutlineItem[] = [
        { title: '', pageNumber: 1, children: [] },
      ];

      const pages: PdfTextPage[] = [createPage([createItem('Content')])];

      const chapters = detectChaptersFromOutline(outline, pages);

      expect(chapters[0].title).toBe('Chapitre 1');
    });
  });

  describe('detectChaptersFromFontSize', () => {
    it('should return empty array when no large headings found', () => {
      const pages: PdfTextPage[] = [
        createPage([
          createItem('Normal text line 1', 12),
          createItem('Normal text line 2', 12),
        ]),
      ];

      expect(detectChaptersFromFontSize(pages)).toEqual([]);
    });

    it('should detect chapters from large font headings', () => {
      const pages: PdfTextPage[] = [
        createPage([
          createItem('Chapter One', 24, 700), // Large font = heading
          createItem('Some content here.', 12, 680),
          createItem('More content.', 12, 660),
        ]),
      ];

      const chapters = detectChaptersFromFontSize(pages);

      expect(chapters.length).toBe(1);
      expect(chapters[0].title).toBe('Chapter One');
      expect(chapters[0].items.length).toBe(2); // The content items
    });

    it('should detect multiple chapters', () => {
      // Use font sizes where headings (24) are clearly larger than body (12)
      // Median of [12, 12, 12, 12, 24, 24] = 12, threshold = 18, 24 > 18 = heading
      const pages: PdfTextPage[] = [
        createPage([
          createItem('Introduction', 24, 700),
          createItem('Intro content line 1.', 12, 680),
          createItem('Intro content line 2.', 12, 660),
          createItem('Chapter One', 24, 500),
          createItem('Chapter content line 1.', 12, 480),
          createItem('Chapter content line 2.', 12, 460),
        ]),
      ];

      const chapters = detectChaptersFromFontSize(pages);

      expect(chapters.length).toBe(2);
      expect(chapters[0].title).toBe('Introduction');
      expect(chapters[1].title).toBe('Chapter One');
    });

    it('should handle content before first heading', () => {
      const pages: PdfTextPage[] = [
        createPage([
          createItem('Preamble text', 12, 750),
          createItem('Chapter One', 24, 700),
          createItem('Chapter content.', 12, 680),
        ]),
      ];

      const chapters = detectChaptersFromFontSize(pages);

      // First chapter is the preamble (no title), second is Chapter One
      expect(chapters.length).toBe(2);
      expect(chapters[0].title).toBe('');
      expect(chapters[1].title).toBe('Chapter One');
    });
  });

  describe('splitByWordLimit', () => {
    it('should return single chapter for short document', () => {
      const pages: PdfTextPage[] = [
        createPage([createItem('Short document.')]),
      ];

      const chapters = splitByWordLimit(pages, MAX_WORDS_PER_CHAPTER);

      expect(chapters.length).toBe(1);
      expect(chapters[0].title).toBe('');
    });

    it('should split long document into multiple chapters', () => {
      // Create a document with many items (more realistic PDF extraction)
      // Each item has ~10 words, so 600 items = ~6000 words
      const items: PdfTextItem[] = [];
      for (let i = 0; i < 600; i++) {
        items.push(createItem('This is a sentence with about ten words in it.', 12, 700 - (i % 50) * 14));
      }
      const pages: PdfTextPage[] = [createPage(items)];

      const chapters = splitByWordLimit(pages, 5000);

      expect(chapters.length).toBeGreaterThan(1);
      expect(chapters[0].title).toBe('Partie 1');
      expect(chapters[1].title).toBe('Partie 2');
    });

    it('should respect custom word limit', () => {
      // Create 30 items with ~10 words each = ~300 words
      const items: PdfTextItem[] = [];
      for (let i = 0; i < 30; i++) {
        items.push(createItem('This is a sentence with about ten words in it.', 12, 700 - (i % 50) * 14));
      }
      const pages: PdfTextPage[] = [createPage(items)];

      const chapters = splitByWordLimit(pages, 100);

      expect(chapters.length).toBeGreaterThan(2);
    });
  });

  describe('findNaturalBreak', () => {
    it('should return items length for single item', () => {
      const items: PdfTextItem[] = [createItem('Single item')];
      expect(findNaturalBreak(items)).toBe(1);
    });

    it('should find break at sentence end', () => {
      const items: PdfTextItem[] = [
        createItem('First sentence.'),
        createItem('Second sentence.'),
        createItem('Third sentence.'),
        createItem('Fourth sentence.'),
      ];

      const breakPoint = findNaturalBreak(items);
      // Should find a break point after a sentence end in the second half
      expect(breakPoint).toBeGreaterThan(items.length / 2);
      expect(breakPoint).toBeLessThanOrEqual(items.length);
    });

    it('should prefer paragraph breaks', () => {
      const items: PdfTextItem[] = [
        createItem('First para.', 12, 100),
        createItem('Still first para.', 12, 100),
        createItem('New paragraph.', 12, 50), // Large Y gap = paragraph break
        createItem('End.', 12, 50),
      ];

      // The function searches backwards from end looking for natural breaks
      const breakPoint = findNaturalBreak(items);
      expect(breakPoint).toBeGreaterThan(0);
    });
  });

  describe('detectChapters (main function)', () => {
    it('should prioritize outline over font size detection', () => {
      const outline: PdfOutlineItem[] = [
        { title: 'From Outline', pageNumber: 1, children: [] },
      ];

      const pages: PdfTextPage[] = [
        createPage([
          createItem('Big Heading', 24, 700),
          createItem('Content.', 12, 680),
        ]),
      ];

      const chapters = detectChapters(pages, outline);

      expect(chapters[0].title).toBe('From Outline');
    });

    it('should fall back to font size when no outline', () => {
      // Make sure heading (24) is clearly larger than body (12)
      // With more body text items, median will be 12, threshold 18
      const pages: PdfTextPage[] = [
        createPage([
          createItem('Chapter Title', 24, 700),
          createItem('Content line 1.', 12, 680),
          createItem('Content line 2.', 12, 660),
          createItem('Content line 3.', 12, 640),
        ]),
      ];

      const chapters = detectChapters(pages, []);

      expect(chapters[0].title).toBe('Chapter Title');
    });

    it('should fall back to word limit when no headings detected', () => {
      // Create long document with no headings (many items with same font size)
      const items: PdfTextItem[] = [];
      for (let i = 0; i < 600; i++) {
        items.push(createItem('This is a sentence with about ten words in it.', 12, 700 - (i % 50) * 14));
      }
      const pages: PdfTextPage[] = [createPage(items)];

      const chapters = detectChapters(pages, []);

      expect(chapters.length).toBeGreaterThan(1);
      expect(chapters[0].title).toBe('Partie 1');
    });

    it('should return single chapter for short document with no structure', () => {
      const pages: PdfTextPage[] = [
        createPage([createItem('Short content.')]),
      ];

      const chapters = detectChapters(pages, []);

      expect(chapters.length).toBe(1);
    });
  });

  describe('MAX_WORDS_PER_CHAPTER constant', () => {
    it('should be 5000', () => {
      expect(MAX_WORDS_PER_CHAPTER).toBe(5000);
    });
  });
});
