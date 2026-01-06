// ABOUTME: Utilities for converting between TipTap JSON and HTML formats
// ABOUTME: Provides centralized extension configuration for consistent parsing

import { generateJSON, generateHTML } from '@tiptap/html/server';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import HardBreak from '@tiptap/extension-hard-break';

/**
 * Standard extensions used across the application
 * CRITICAL: This list must match what the editor uses
 * Missing extensions = lost formatting on import
 */
export const TIPTAP_EXTENSIONS = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Highlight.configure({ multicolor: true }),
  Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
  BulletList,
  OrderedList,
  ListItem,
  HardBreak,
];

/**
 * Convert HTML to TipTap JSON
 * @param html - HTML string (from mammoth or other source)
 * @returns TipTap JSON object
 */
export function htmlToTipTapJSON(html: string): any {
  try {
    return generateJSON(html, TIPTAP_EXTENSIONS);
  } catch (error) {
    // If conversion fails, return empty document
    console.error('Failed to convert HTML to TipTap JSON:', error);
    return {
      type: 'doc',
      content: [],
    };
  }
}

/**
 * Convert TipTap JSON to HTML
 * @param json - TipTap JSON object
 * @returns HTML string
 */
export function tiptapJSONToHTML(json: any): string {
  try {
    return generateHTML(json, TIPTAP_EXTENSIONS);
  } catch (error) {
    console.error('Failed to convert TipTap JSON to HTML:', error);
    return '';
  }
}

/**
 * Validate TipTap JSON structure
 * @param json - Object to validate
 * @returns true if valid TipTap JSON
 */
export function isValidTipTapJSON(json: any): boolean {
  return !!(
    json &&
    typeof json === 'object' &&
    json.type === 'doc' &&
    Array.isArray(json.content)
  );
}

/**
 * Create empty TipTap document
 * @returns Empty TipTap JSON document
 */
export function createEmptyTipTapDoc(): any {
  return {
    type: 'doc',
    content: [],
  };
}

/**
 * Extract plain text from TipTap JSON (for search, word count, etc.)
 * @param json - TipTap JSON object
 * @returns Plain text string
 */
export function extractTextFromTipTapJSON(json: any): string {
  if (!json) return '';

  if (json.type === 'text' && json.text) {
    return json.text;
  }

  if (json.content && Array.isArray(json.content)) {
    return json.content
      .map((node: any) => extractTextFromTipTapJSON(node))
      .join(' ');
  }

  return '';
}
