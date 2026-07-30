// ABOUTME: Unit tests for converting grammar-engine block offsets to ProseMirror positions.
// ABOUTME: Uses manually constructed ProseMirror nodes without creating a TipTap editor.

import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import { mapBlockTextOffset } from '../mapBlockTextOffset';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
    inlineAtom: { atom: true, group: 'inline', inline: true },
  },
  marks: {
    em: {},
    strong: {},
  },
});

describe('mapBlockTextOffset', () => {
  it('maps offsets in a block containing one text node', () => {
    const block = schema.node('paragraph', null, schema.text('bonjour'));

    expect(mapBlockTextOffset(block, 10, 0)).toBe(11);
    expect(mapBlockTextOffset(block, 10, 4)).toBe(15);
    expect(mapBlockTextOffset(block, 10, 7)).toBe(18);
  });

  it('maps offsets through text nodes split by marks', () => {
    const block = schema.node('paragraph', null, [
      schema.text('bon', [schema.mark('em')]),
      schema.text('jour', [schema.mark('strong')]),
    ]);

    expect(mapBlockTextOffset(block, 50, 3)).toBe(54);
    expect(mapBlockTextOffset(block, 50, 7)).toBe(58);
  });

  it('accounts for an inline atom between text nodes', () => {
    const block = schema.node('paragraph', null, [
      schema.text('ab'),
      schema.node('inlineAtom'),
      schema.text('cd'),
    ]);

    expect(mapBlockTextOffset(block, 20, 2)).toBe(24);
    expect(mapBlockTextOffset(block, 20, 4)).toBe(26);
  });

  it('uses JavaScript UTF-16 offsets for characters outside the BMP', () => {
    const block = schema.node('paragraph', null, schema.text('a😀b'));

    expect(mapBlockTextOffset(block, 7, 3)).toBe(11);
    expect(mapBlockTextOffset(block, 7, 4)).toBe(12);
  });
});
