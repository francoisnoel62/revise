// ABOUTME: Tests for TipTapContentService
// ABOUTME: Validates text extraction and TipTap JSON generation

import { describe, it, expect } from 'vitest';
import { TipTapContentService } from './TipTapContentService';

describe('TipTapContentService', () => {
  const service = new TipTapContentService();

  describe('extractText', () => {
    it('should extract text from TipTap JSON', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      expect(service.extractText(content)).toBe('Hello world');
    });

    it('should extract text from multiple paragraphs', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First paragraph' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Second paragraph' }],
          },
        ],
      });

      expect(service.extractText(content)).toContain('First paragraph');
      expect(service.extractText(content)).toContain('Second paragraph');
    });

    it('should return empty string for empty content', () => {
      expect(service.extractText('')).toBe('');
      expect(service.extractText('   ')).toBe('');
    });

    it('should return content as-is if not valid JSON', () => {
      const plainText = 'Just plain text';
      expect(service.extractText(plainText)).toBe(plainText);
    });

    it('should handle empty document', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [],
      });

      expect(service.extractText(content)).toBe('');
    });
  });

  describe('toEditorContent', () => {
    describe('chapter-beginning and chapter-full', () => {
      it('should create paragraphs from double newline separated text', () => {
        const text = 'First paragraph.\n\nSecond paragraph.';
        const result = JSON.parse(
          service.toEditorContent(text, 'chapter-beginning')
        );

        expect(result.type).toBe('doc');
        expect(result.content).toHaveLength(2);
        expect(result.content[0].type).toBe('paragraph');
        expect(result.content[0].content[0].text).toBe('First paragraph.');
        expect(result.content[1].content[0].text).toBe('Second paragraph.');
      });

      it('should work the same for chapter-full', () => {
        const text = 'One.\n\nTwo.\n\nThree.';
        const result = JSON.parse(
          service.toEditorContent(text, 'chapter-full')
        );

        expect(result.content).toHaveLength(3);
      });

      it('should handle single paragraph', () => {
        const text = 'Single paragraph without breaks.';
        const result = JSON.parse(
          service.toEditorContent(text, 'chapter-beginning')
        );

        expect(result.content).toHaveLength(1);
        expect(result.content[0].content[0].text).toBe(text);
      });
    });

    describe('chapter-outline', () => {
      it('should create paragraphs from single newline separated text', () => {
        const text = '1. First point\n2. Second point\n3. Third point';
        const result = JSON.parse(
          service.toEditorContent(text, 'chapter-outline')
        );

        expect(result.type).toBe('doc');
        expect(result.content).toHaveLength(3);
        expect(result.content[0].content[0].text).toBe('1. First point');
        expect(result.content[1].content[0].text).toBe('2. Second point');
        expect(result.content[2].content[0].text).toBe('3. Third point');
      });

      it('should filter empty lines', () => {
        const text = '1. First\n\n2. Second\n\n\n3. Third';
        const result = JSON.parse(
          service.toEditorContent(text, 'chapter-outline')
        );

        expect(result.content).toHaveLength(3);
      });
    });

    it('should handle empty text', () => {
      const result = JSON.parse(service.toEditorContent('', 'chapter-full'));

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
    });

    it('should return valid JSON string', () => {
      const text = 'Some content';
      const result = service.toEditorContent(text, 'chapter-beginning');

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
