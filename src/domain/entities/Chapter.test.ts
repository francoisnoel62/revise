import { describe, it, expect } from 'vitest';
import { Chapter } from './Chapter';

describe('Chapter', () => {
  const validTipTapJSON = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world' }],
      },
    ],
  });

  describe('constructor', () => {
    it('should create a chapter with valid data', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);

      expect(chapter.getId()).toBe('id-1');
      expect(chapter.getTitle()).toBe('Chapter 1');
      expect(chapter.getContent()).toBe(validTipTapJSON);
      expect(chapter.getOrder()).toBe(0);
    });

    it('should calculate metadata on creation', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      const metadata = chapter.getMetadata();

      expect(metadata.wordCount).toBe(2); // "Hello world"
      expect(metadata.characterCount).toBe(11);
      expect(metadata.lastEdited).toBeInstanceOf(Date);
    });
  });

  describe('updateTitle', () => {
    it('should update title successfully', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      chapter.updateTitle('New Title');

      expect(chapter.getTitle()).toBe('New Title');
    });

    it('should trim whitespace from title', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      chapter.updateTitle('  New Title  ');

      expect(chapter.getTitle()).toBe('New Title');
    });

    it('should throw error for empty title', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);

      expect(() => chapter.updateTitle('')).toThrow('Chapter title cannot be empty');
      expect(() => chapter.updateTitle('   ')).toThrow('Chapter title cannot be empty');
    });
  });

  describe('updateContent', () => {
    it('should update content and recalculate metadata', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);

      const newContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is a longer paragraph with more words' }],
          },
        ],
      });

      chapter.updateContent(newContent);

      expect(chapter.getContent()).toBe(newContent);
      expect(chapter.getMetadata().wordCount).toBe(8);
    });

    it('should throw error for invalid JSON', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);

      expect(() => chapter.updateContent('not valid json')).toThrow('Invalid JSON format');
    });

    it('should throw error for invalid TipTap structure', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      const invalidJSON = JSON.stringify({ type: 'invalid' });

      expect(() => chapter.updateContent(invalidJSON)).toThrow('Invalid TipTap JSON');
    });
  });

  describe('reorder', () => {
    it('should update order successfully', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      chapter.reorder(5);

      expect(chapter.getOrder()).toBe(5);
    });

    it('should throw error for negative order', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);

      expect(() => chapter.reorder(-1)).toThrow('Chapter order must be non-negative');
    });
  });

  describe('metadata calculation', () => {
    it('should calculate word count correctly for simple text', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'One two three four five' }],
          },
        ],
      });

      const chapter = new Chapter('id-1', 'Test', content, 0);
      expect(chapter.getMetadata().wordCount).toBe(5);
    });

    it('should calculate word count correctly for multiple paragraphs', () => {
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

      const chapter = new Chapter('id-1', 'Test', content, 0);
      expect(chapter.getMetadata().wordCount).toBe(4);
    });

    it('should handle empty content', () => {
      const emptyContent = JSON.stringify({ type: 'doc', content: [] });
      const chapter = new Chapter('id-1', 'Empty', emptyContent, 0);

      expect(chapter.getMetadata().wordCount).toBe(0);
      expect(chapter.getMetadata().characterCount).toBe(0);
    });

    it('should handle content with formatted text', () => {
      const formattedContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Bold ' },
              {
                type: 'text',
                text: 'text',
                marks: [{ type: 'bold' }],
              },
            ],
          },
        ],
      });

      const chapter = new Chapter('id-1', 'Test', formattedContent, 0);
      expect(chapter.getMetadata().wordCount).toBe(2);
      expect(chapter.getMetadata().characterCount).toBe(10); // "Bold " + "text" with space between nodes
    });
  });

  describe('getMetadata', () => {
    it('should return a copy of metadata (immutability)', () => {
      const chapter = new Chapter('id-1', 'Chapter 1', validTipTapJSON, 0);
      const metadata1 = chapter.getMetadata();
      const metadata2 = chapter.getMetadata();

      expect(metadata1).not.toBe(metadata2); // Different objects
      expect(metadata1).toEqual(metadata2); // Same values
    });
  });
});
