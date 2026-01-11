// ABOUTME: Tests for PDF formatting utilities
// ABOUTME: Tests font name parsing and TipTap mark generation

import { describe, it, expect } from 'vitest';
import {
  parseFontName,
  fontInfoToMarks,
  fontSizeToMark,
  detectHeadingLevel,
  isShortLine,
  groupIntoParagraphs,
  buildTipTapNode,
} from './pdf-formatting';
import type { PdfTextItem } from './pdf-text-extraction';

describe('pdf-formatting', () => {
  describe('parseFontName', () => {
    it('should detect bold from font name', () => {
      expect(parseFontName('Arial-Bold').bold).toBe(true);
      expect(parseFontName('TimesNewRoman-Bold').bold).toBe(true);
      expect(parseFontName('BCDEFG+Arial-Bold').bold).toBe(true);
    });

    it('should detect italic from font name', () => {
      expect(parseFontName('Arial-Italic').italic).toBe(true);
      expect(parseFontName('TimesNewRoman-Oblique').italic).toBe(true);
      expect(parseFontName('BCDEFG+Arial-Italic').italic).toBe(true);
    });

    it('should detect bold-italic combination', () => {
      const result = parseFontName('Arial-BoldItalic');
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(true);
    });

    it('should extract font family', () => {
      expect(parseFontName('Arial-Bold').family).toBe('Arial');
      expect(parseFontName('TimesNewRoman').family).toBe('Times New Roman');
      expect(parseFontName('Georgia-Italic').family).toBe('Georgia');
    });

    it('should handle subset prefix', () => {
      const result = parseFontName('ABCDEF+Arial-Bold');
      expect(result.family).toBe('Arial');
      expect(result.bold).toBe(true);
    });

    it('should return defaults for empty font name', () => {
      const result = parseFontName('');
      expect(result.family).toBe('serif');
      expect(result.bold).toBe(false);
      expect(result.italic).toBe(false);
    });

    it('should detect Black as bold variant', () => {
      expect(parseFontName('Arial-Black').bold).toBe(true);
    });

    it('should detect Heavy as bold variant', () => {
      expect(parseFontName('Helvetica-Heavy').bold).toBe(true);
    });
  });

  describe('fontInfoToMarks', () => {
    it('should return bold mark when bold is true', () => {
      const marks = fontInfoToMarks({ family: 'Arial', bold: true, italic: false });
      expect(marks).toContainEqual({ type: 'bold' });
    });

    it('should return italic mark when italic is true', () => {
      const marks = fontInfoToMarks({ family: 'Arial', bold: false, italic: true });
      expect(marks).toContainEqual({ type: 'italic' });
    });

    it('should return both marks when bold and italic', () => {
      const marks = fontInfoToMarks({ family: 'Arial', bold: true, italic: true });
      expect(marks).toContainEqual({ type: 'bold' });
      expect(marks).toContainEqual({ type: 'italic' });
    });

    it('should return empty array when neither bold nor italic', () => {
      const marks = fontInfoToMarks({ family: 'Arial', bold: false, italic: false });
      expect(marks).toEqual([]);
    });

    it('should include font family when includeFontFamily is true', () => {
      const marks = fontInfoToMarks(
        { family: 'Georgia', bold: false, italic: false },
        true
      );
      expect(marks).toContainEqual({
        type: 'textStyle',
        attrs: { fontFamily: 'Georgia' },
      });
    });
  });

  describe('fontSizeToMark', () => {
    it('should return textStyle mark for non-default sizes', () => {
      const mark = fontSizeToMark(11);
      expect(mark).toEqual({
        type: 'textStyle',
        attrs: { fontSize: '11pt' },
      });
    });

    it('should return null for default size (13pt)', () => {
      expect(fontSizeToMark(13)).toBeNull();
    });

    it('should round font sizes', () => {
      const mark = fontSizeToMark(11.7);
      expect(mark).toEqual({
        type: 'textStyle',
        attrs: { fontSize: '12pt' },
      });
    });

    it('should return null for sizes outside supported range', () => {
      expect(fontSizeToMark(5)).toBeNull();
      expect(fontSizeToMark(25)).toBeNull();
    });
  });

  describe('detectHeadingLevel', () => {
    const medianFontSize = 12;

    it('should detect heading level 1 for >= 200% of median', () => {
      expect(detectHeadingLevel(24, medianFontSize, true)).toBe(1);
      expect(detectHeadingLevel(30, medianFontSize, true)).toBe(1);
    });

    it('should detect heading level 2 for >= 150% of median', () => {
      expect(detectHeadingLevel(18, medianFontSize, true)).toBe(2);
      expect(detectHeadingLevel(20, medianFontSize, true)).toBe(2);
    });

    it('should detect heading level 3 for >= 130% of median', () => {
      expect(detectHeadingLevel(16, medianFontSize, true)).toBe(3);
    });

    it('should return null for normal-sized text', () => {
      expect(detectHeadingLevel(12, medianFontSize, true)).toBeNull();
      expect(detectHeadingLevel(14, medianFontSize, true)).toBeNull();
    });

    it('should return null for long lines even with large font', () => {
      expect(detectHeadingLevel(24, medianFontSize, false)).toBeNull();
    });
  });

  describe('isShortLine', () => {
    it('should return true for short text', () => {
      expect(isShortLine('Chapter One')).toBe(true);
      expect(isShortLine('Introduction')).toBe(true);
    });

    it('should return false for long text', () => {
      const longText = 'This is a very long paragraph that contains many words and should definitely not be considered a heading because it is way too long for that purpose.';
      expect(isShortLine(longText)).toBe(false);
    });

    it('should respect custom max chars', () => {
      expect(isShortLine('Hello World', 5)).toBe(false);
      expect(isShortLine('Hello World', 50)).toBe(true);
    });
  });

  describe('groupIntoParagraphs', () => {
    it('should return empty array for empty input', () => {
      expect(groupIntoParagraphs([])).toEqual([]);
    });

    it('should group items at same vertical level', () => {
      const items: PdfTextItem[] = [
        { text: 'Hello ', fontName: '', fontSize: 12, x: 0, y: 100, width: 50, height: 12 },
        { text: 'World', fontName: '', fontSize: 12, x: 50, y: 100, width: 50, height: 12 },
      ];

      const groups = groupIntoParagraphs(items);
      expect(groups.length).toBe(1);
      expect(groups[0].length).toBe(2);
    });

    it('should separate items with large vertical gap', () => {
      const items: PdfTextItem[] = [
        { text: 'First paragraph', fontName: '', fontSize: 12, x: 0, y: 100, width: 100, height: 12 },
        { text: 'Second paragraph', fontName: '', fontSize: 12, x: 0, y: 70, width: 100, height: 12 },
      ];

      const groups = groupIntoParagraphs(items);
      expect(groups.length).toBe(2);
    });
  });

  describe('buildTipTapNode', () => {
    const medianFontSize = 12;

    it('should return empty paragraph for empty items', () => {
      const node = buildTipTapNode([], medianFontSize);
      expect(node.type).toBe('paragraph');
      expect(node.content).toEqual([]);
    });

    it('should build paragraph with text content', () => {
      const items: PdfTextItem[] = [
        { text: 'Hello World', fontName: 'Arial', fontSize: 12, x: 0, y: 100, width: 100, height: 12 },
      ];

      const node = buildTipTapNode(items, medianFontSize);
      expect(node.type).toBe('paragraph');
      expect((node.content as Array<{ text: string }>)[0].text).toBe('Hello World');
    });

    it('should build heading for large font', () => {
      const items: PdfTextItem[] = [
        { text: 'Title', fontName: 'Arial-Bold', fontSize: 24, x: 0, y: 100, width: 100, height: 24 },
      ];

      const node = buildTipTapNode(items, medianFontSize);
      expect(node.type).toBe('heading');
      expect((node.attrs as { level: number }).level).toBe(1);
    });

    it('should apply bold mark for bold font', () => {
      const items: PdfTextItem[] = [
        { text: 'Bold text', fontName: 'Arial-Bold', fontSize: 12, x: 0, y: 100, width: 100, height: 12 },
      ];

      const node = buildTipTapNode(items, medianFontSize);
      const content = node.content as Array<{ marks?: Array<{ type: string }> }>;
      expect(content[0].marks).toContainEqual({ type: 'bold' });
    });

    it('should apply italic mark for italic font', () => {
      const items: PdfTextItem[] = [
        { text: 'Italic text', fontName: 'Arial-Italic', fontSize: 12, x: 0, y: 100, width: 100, height: 12 },
      ];

      const node = buildTipTapNode(items, medianFontSize);
      const content = node.content as Array<{ marks?: Array<{ type: string }> }>;
      expect(content[0].marks).toContainEqual({ type: 'italic' });
    });
  });
});
