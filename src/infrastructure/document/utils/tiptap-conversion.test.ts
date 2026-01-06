/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  htmlToTipTapJSON,
  tiptapJSONToHTML,
  isValidTipTapJSON,
  createEmptyTipTapDoc,
  extractTextFromTipTapJSON,
} from './tiptap-conversion';

describe('tiptap-conversion utilities', () => {
  describe('htmlToTipTapJSON', () => {
    it('should convert simple HTML to TipTap JSON', () => {
      const html = '<p>Hello world</p>';
      const json = htmlToTipTapJSON(html);

      expect(json.type).toBe('doc');
      expect(json.content).toHaveLength(1);
      expect(json.content[0].type).toBe('paragraph');
    });

    it('should preserve bold formatting', () => {
      const html = '<p>This is <strong>bold</strong> text</p>';
      const json = htmlToTipTapJSON(html);

      const textNodes = json.content[0].content;
      const boldNode = textNodes.find((n: any) =>
        n.marks && n.marks.some((m: any) => m.type === 'bold')
      );

      expect(boldNode).toBeDefined();
      expect(boldNode.text).toBe('bold');
    });

    it('should preserve italic formatting', () => {
      const html = '<p>This is <em>italic</em> text</p>';
      const json = htmlToTipTapJSON(html);

      const textNodes = json.content[0].content;
      const italicNode = textNodes.find((n: any) =>
        n.marks && n.marks.some((m: any) => m.type === 'italic')
      );

      expect(italicNode).toBeDefined();
      expect(italicNode.text).toBe('italic');
    });

    it('should preserve underline formatting', () => {
      const html = '<p>This is <u>underlined</u> text</p>';
      const json = htmlToTipTapJSON(html);

      const textNodes = json.content[0].content;
      const underlineNode = textNodes.find((n: any) =>
        n.marks && n.marks.some((m: any) => m.type === 'underline')
      );

      expect(underlineNode).toBeDefined();
      expect(underlineNode.text).toBe('underlined');
    });

    it('should preserve headings', () => {
      const html = '<h1>Chapter Title</h1>';
      const json = htmlToTipTapJSON(html);

      expect(json.content[0].type).toBe('heading');
      expect(json.content[0].attrs.level).toBe(1);
    });

    it('should handle invalid HTML gracefully', () => {
      const html = 'not valid html <>';
      const json = htmlToTipTapJSON(html);

      expect(isValidTipTapJSON(json)).toBe(true);
    });
  });

  describe('tiptapJSONToHTML', () => {
    it('should convert TipTap JSON to HTML', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      };

      const html = tiptapJSONToHTML(json);
      expect(html).toContain('Hello world');
      expect(html).toMatch(/<p[^>]*>/);
    });

    it('should preserve bold marks', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'bold',
                marks: [{ type: 'bold' }],
              },
            ],
          },
        ],
      };

      const html = tiptapJSONToHTML(json);
      expect(html).toContain('<strong>');
      expect(html).toContain('bold');
    });
  });

  describe('isValidTipTapJSON', () => {
    it('should return true for valid TipTap JSON', () => {
      const json = {
        type: 'doc',
        content: [],
      };

      expect(isValidTipTapJSON(json)).toBe(true);
    });

    it('should return false for invalid structures', () => {
      expect(isValidTipTapJSON(null)).toBe(false);
      expect(isValidTipTapJSON(undefined)).toBe(false);
      expect(isValidTipTapJSON({})).toBe(false);
      expect(isValidTipTapJSON({ type: 'doc' })).toBe(false);
      expect(isValidTipTapJSON({ content: [] })).toBe(false);
    });
  });

  describe('createEmptyTipTapDoc', () => {
    it('should create valid empty document', () => {
      const doc = createEmptyTipTapDoc();

      expect(isValidTipTapJSON(doc)).toBe(true);
      expect(doc.content).toHaveLength(0);
    });
  });

  describe('extractTextFromTipTapJSON', () => {
    it('should extract text from simple paragraph', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      };

      const text = extractTextFromTipTapJSON(json);
      expect(text).toBe('Hello world');
    });

    it('should extract text from multiple paragraphs', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Second' }],
          },
        ],
      };

      const text = extractTextFromTipTapJSON(json);
      expect(text).toContain('First');
      expect(text).toContain('Second');
    });

    it('should ignore formatting marks', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'bold text',
                marks: [{ type: 'bold' }],
              },
            ],
          },
        ],
      };

      const text = extractTextFromTipTapJSON(json);
      expect(text).toBe('bold text');
    });
  });
});
