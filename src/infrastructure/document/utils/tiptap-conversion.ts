// ABOUTME: Utilities for converting between TipTap JSON and HTML formats
// ABOUTME: Provides centralized extension configuration for consistent parsing

import { generateJSON, generateHTML } from '@tiptap/html/server';
import Document from '@tiptap/extension-document';
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
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import TextAlign from '@tiptap/extension-text-align';
import { IndentParagraph } from '@/components/editor/extensions/IndentParagraph';

/**
 * Standard extensions used across the application
 * CRITICAL: This list must match what the editor uses
 * Missing extensions = lost formatting on import
 */
export const TIPTAP_EXTENSIONS = [
  Document,
  IndentParagraph, // Custom paragraph with indent support (replaces standard Paragraph)
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
  TextStyle, // Required for FontFamily and FontSize
  FontFamily.configure({
    types: ['textStyle'],
  }),
  FontSize.configure({
    types: ['textStyle'],
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
    defaultAlignment: 'justify',
  }),
];

/**
 * Convert HTML to TipTap JSON
 * @param html - HTML string (from mammoth or other source)
 * @returns TipTap JSON object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTextFromTipTapJSON(json: any): string {
  if (!json) return '';

  if (json.type === 'text' && json.text) {
    return json.text;
  }

  if (json.content && Array.isArray(json.content)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return json.content.map((node: any) => extractTextFromTipTapJSON(node)).join(' ');
  }

  return '';
}
