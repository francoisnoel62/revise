// ABOUTME: Unit tests for walking a stored TipTap document into positioned text blocks.
// ABOUTME: Pins the ProseMirror position arithmetic the grammar checker depends on.

import { describe, expect, it } from 'vitest';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import { collectDocumentTextBlocks } from '../collectDocumentTextBlocks';
import { mapBlockFragmentOffset } from '../blockTextOffsets';

const paragraph = (text: string): ContentNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('collectDocumentTextBlocks', () => {
  it('returns one block per paragraph, with the position of its first character', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [paragraph('Les chien'), paragraph('Bonjour')],
    };

    const blocks = collectDocumentTextBlocks(doc);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].text).toBe('Les chien');
    expect(blocks[0].textStart).toBe(1);
    expect(blocks[1].text).toBe('Bonjour');
    expect(blocks[1].textStart).toBe(12);
  });

  it('includes headings and quotes', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Titre' }] },
        { type: 'blockquote', content: [paragraph('Citation')] },
      ],
    };

    const blocks = collectDocumentTextBlocks(doc);

    expect(blocks.map((block) => block.text)).toEqual(['Titre', 'Citation']);
    // heading occupies 0..6, blockquote opens at 7, its paragraph at 8, text at 9
    expect(blocks[1].textStart).toBe(9);
  });

  it('counts an empty block as two positions', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [{ type: 'paragraph' }, paragraph('Bonjour')],
    };

    const blocks = collectDocumentTextBlocks(doc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].textStart).toBe(3);
  });

  it('joins text split by marks into a single block text', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Les ', marks: [{ type: 'em' }] },
            { type: 'text', text: 'chien' },
          ],
        },
      ],
    };

    const [block] = collectDocumentTextBlocks(doc);

    expect(block.text).toBe('Les chien');
    expect(mapBlockFragmentOffset(block.fragments, block.textStart, 4)).toBe(5);
  });

  it('keeps text after a line break aligned', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Un' },
            { type: 'hardBreak' },
            { type: 'text', text: 'deux' },
          ],
        },
      ],
    };

    const [block] = collectDocumentTextBlocks(doc);

    expect(block.text).toBe('Un\ndeux');
    // 'Un' at 1-2, the break at 3, 'deux' at 4-7
    expect(mapBlockFragmentOffset(block.fragments, block.textStart, 3)).toBe(4);
  });

  it('leaves no text for an inline atom but keeps its position', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'mot' },
            { type: 'endnoteRef', attrs: { content: null } },
            { type: 'text', text: ' suite' },
          ],
        },
        paragraph('Bonjour'),
      ],
    };

    const blocks = collectDocumentTextBlocks(doc);

    expect(blocks[0].text).toBe('mot suite');
    // 'mot' at 1-3, the call at 4, ' suite' at 5-10
    expect(mapBlockFragmentOffset(blocks[0].fragments, blocks[0].textStart, 3)).toBe(5);
    expect(blocks[1].textStart).toBe(13);
  });

  it('skips code blocks, which carry no prose', () => {
    const doc: ContentNode = {
      type: 'doc',
      content: [
        { type: 'codeBlock', content: [{ type: 'text', text: 'const a = 1' }] },
        paragraph('Bonjour'),
      ],
    };

    const blocks = collectDocumentTextBlocks(doc);

    expect(blocks.map((block) => block.text)).toEqual(['Bonjour']);
    expect(blocks[0].textStart).toBe(14);
  });

  it('returns nothing for an empty document', () => {
    expect(collectDocumentTextBlocks({ type: 'doc', content: [] })).toEqual([]);
    expect(collectDocumentTextBlocks({ type: 'doc' })).toEqual([]);
  });
});
