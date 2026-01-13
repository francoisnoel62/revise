// ABOUTME: TipTap JSON fixture builders for consistent test data creation.
// ABOUTME: Provides factory functions to create valid TipTap document structures.

import type { JSONContent } from '@tiptap/core';

/**
 * Create an empty TipTap document.
 */
export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [],
  };
}

/**
 * Create a TipTap document with a single paragraph.
 * @param text The text content of the paragraph
 */
export function createSimpleDocument(text: string): JSONContent {
  if (!text) {
    return createEmptyDocument();
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ],
  };
}

/**
 * Create a TipTap document with multiple paragraphs.
 * @param paragraphs Array of paragraph texts
 */
export function createMultiParagraphDocument(paragraphs: string[]): JSONContent {
  return {
    type: 'doc',
    content: paragraphs.map(text => ({
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    })),
  };
}

/**
 * Create a TipTap document with formatted text (bold, italic, etc.).
 * @param text The text content
 * @param marks Array of mark types to apply (e.g., ['bold', 'italic'])
 */
export function createFormattedDocument(
  text: string,
  marks: Array<'bold' | 'italic' | 'underline' | 'highlight'>
): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text,
            marks: marks.map(mark => ({ type: mark })),
          },
        ],
      },
    ],
  };
}

/**
 * Create a TipTap document with mixed formatting.
 * @param segments Array of { text, marks } objects
 */
export function createMixedFormattingDocument(
  segments: Array<{
    text: string;
    marks?: Array<'bold' | 'italic' | 'underline' | 'highlight'>;
  }>
): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: segments.map(({ text, marks }) => ({
          type: 'text',
          text,
          ...(marks && marks.length > 0
            ? { marks: marks.map(mark => ({ type: mark })) }
            : {}),
        })),
      },
    ],
  };
}

/**
 * Create a TipTap document with headings.
 * @param level Heading level (1-6)
 * @param text Heading text
 */
export function createHeadingDocument(level: 1 | 2 | 3 | 4 | 5 | 6, text: string): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level },
        content: [{ type: 'text', text }],
      },
    ],
  };
}

/**
 * Create a TipTap document with a heading followed by paragraphs.
 * @param title The heading text
 * @param paragraphs Array of paragraph texts
 */
export function createChapterDocument(title: string, paragraphs: string[]): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: title }],
      },
      ...paragraphs.map(text => ({
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      })),
    ],
  };
}

/**
 * Create a realistic fiction chapter document.
 * @param title Chapter title
 * @param wordCount Approximate word count to generate
 */
export function createFictionChapter(title: string, wordCount: number = 500): JSONContent {
  const loremWords = [
    'Le', 'soleil', 'se', 'couchait', 'sur', 'la', 'ville', 'endormie',
    'Un', 'vent', 'frais', 'soufflait', 'dans', 'les', 'rues', 'désertes',
    'Elle', 'marchait', 'lentement', 'perdue', 'dans', 'ses', 'pensées',
    'Le', 'temps', 'passait', 'sans', 'qu\'elle', 's\'en', 'aperçoive',
    'Les', 'étoiles', 'brillaient', 'au-dessus', 'de', 'sa', 'tête',
  ];

  const paragraphs: string[] = [];
  let currentWordCount = 0;

  while (currentWordCount < wordCount) {
    const sentenceCount = Math.floor(Math.random() * 3) + 3;
    const sentences: string[] = [];

    for (let i = 0; i < sentenceCount && currentWordCount < wordCount; i++) {
      const sentenceLength = Math.floor(Math.random() * 10) + 5;
      const sentence: string[] = [];

      for (let j = 0; j < sentenceLength; j++) {
        sentence.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
        currentWordCount++;
      }

      sentences.push(sentence.join(' ') + '.');
    }

    paragraphs.push(sentences.join(' '));
  }

  return createChapterDocument(title, paragraphs);
}

/**
 * Convert TipTap JSON to string for storage.
 */
export function stringify(doc: JSONContent): string {
  return JSON.stringify(doc);
}

/**
 * Parse TipTap JSON string to object.
 */
export function parse(content: string): JSONContent {
  return JSON.parse(content) as JSONContent;
}

/**
 * Extract plain text from TipTap JSON.
 */
export function extractText(doc: JSONContent): string {
  const texts: string[] = [];

  function traverse(node: JSONContent) {
    if (node.type === 'text' && node.text) {
      texts.push(node.text);
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(doc);
  return texts.join(' ');
}

/**
 * Count words in TipTap JSON.
 */
export function countWords(doc: JSONContent): number {
  const text = extractText(doc);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Count characters in TipTap JSON.
 */
export function countCharacters(doc: JSONContent): number {
  return extractText(doc).length;
}
