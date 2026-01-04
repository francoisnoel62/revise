// ABOUTME: Comprehensive test suite for TextDocument entity covering content management and text selection
// ABOUTME: Validates core domain behavior for document manipulation and selection extraction

import { describe, it, expect } from 'vitest';
import { TextDocument } from './TextDocument';
import { TextSelection } from '../value-objects/TextSelection';

describe('TextDocument', () => {
  describe('construction', () => {
    it('should create a document with content', () => {
      const content = 'Hello, world!';
      const doc = new TextDocument(content);

      expect(doc.getContent()).toBe(content);
    });

    it('should create an empty document by default', () => {
      const doc = new TextDocument();

      expect(doc.getContent()).toBe('');
    });
  });

  describe('updateContent', () => {
    it('should update document content', () => {
      const doc = new TextDocument('Initial content');
      doc.updateContent('Updated content');

      expect(doc.getContent()).toBe('Updated content');
    });

    it('should allow setting empty content', () => {
      const doc = new TextDocument('Some content');
      doc.updateContent('');

      expect(doc.getContent()).toBe('');
    });
  });

  describe('replaceSelection', () => {
    it('should replace selected text with new text', () => {
      const doc = new TextDocument('Hello, world!');
      const selection = new TextSelection(0, 5); // "Hello"

      doc.replaceSelection(selection, 'Goodbye');

      expect(doc.getContent()).toBe('Goodbye, world!');
    });

    it('should replace text in the middle', () => {
      const doc = new TextDocument('The quick brown fox');
      const selection = new TextSelection(10, 15); // "brown"

      doc.replaceSelection(selection, 'red');

      expect(doc.getContent()).toBe('The quick red fox');
    });

    it('should handle replacement at the end', () => {
      const doc = new TextDocument('Hello, world');
      const selection = new TextSelection(7, 12); // "world"

      doc.replaceSelection(selection, 'universe');

      expect(doc.getContent()).toBe('Hello, universe');
    });

    it('should throw error for invalid selection range', () => {
      const doc = new TextDocument('Hello');
      const selection = new TextSelection(0, 10); // Beyond content length

      expect(() => {
        doc.replaceSelection(selection, 'Hi');
      }).toThrow('Selection range exceeds document length');
    });
  });

  describe('getSelectedText', () => {
    it('should extract selected text', () => {
      const doc = new TextDocument('The quick brown fox jumps');
      const selection = new TextSelection(4, 9); // "quick"

      expect(doc.getSelectedText(selection)).toBe('quick');
    });

    it('should extract text at document start', () => {
      const doc = new TextDocument('Hello, world!');
      const selection = new TextSelection(0, 5);

      expect(doc.getSelectedText(selection)).toBe('Hello');
    });

    it('should throw error for invalid selection', () => {
      const doc = new TextDocument('Short');
      const selection = new TextSelection(0, 100);

      expect(() => {
        doc.getSelectedText(selection);
      }).toThrow('Selection range exceeds document length');
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty document', () => {
      const doc = new TextDocument('');

      expect(doc.isEmpty()).toBe(true);
    });

    it('should return false for non-empty document', () => {
      const doc = new TextDocument('Content');

      expect(doc.isEmpty()).toBe(false);
    });
  });

  describe('getLength', () => {
    it('should return correct length', () => {
      const doc = new TextDocument('Hello, world!');

      expect(doc.getLength()).toBe(13);
    });

    it('should return 0 for empty document', () => {
      const doc = new TextDocument();

      expect(doc.getLength()).toBe(0);
    });
  });
});
