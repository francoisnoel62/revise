// ABOUTME: Tests for the guard deciding whether the editor already displays a stored document.
// ABOUTME: Covers schema-filled default attributes, real differences and unparsable content.

import { describe, expect, it } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import { documentMatchesContent } from '../documentMatchesContent';

// Mirrors the real editor on the point that matters: attributes carrying a
// default the stored document never persisted.
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'text*',
      group: 'block',
      attrs: { textAlign: { default: 'justify' } },
    },
    heading: {
      content: 'text*',
      group: 'block',
      attrs: { level: { default: 1 }, textAlign: { default: 'justify' } },
    },
    text: { group: 'inline' },
  },
});

const stored = (text: string): ContentNode =>
  ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }) as ContentNode;

describe('documentMatchesContent', () => {
  it('matches when the stored content omits an attribute the schema fills in', () => {
    const content = stored('Les chien de la voisine sont partis.');
    const doc = schema.nodeFromJSON(content);

    expect(documentMatchesContent(schema, doc, content)).toBe(true);
  });

  it('matches a heading whose stored attributes are a subset of the schema defaults', () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Les maison closes' }] },
      ],
    } as ContentNode;
    const doc = schema.nodeFromJSON(content);

    expect(documentMatchesContent(schema, doc, content)).toBe(true);
  });

  it('matches regardless of the order attributes are written in', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2, textAlign: 'left' }, content: [{ type: 'text', text: 'Titre' }] },
      ],
    });
    const reordered = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { textAlign: 'left', level: 2 }, content: [{ type: 'text', text: 'Titre' }] },
      ],
    } as ContentNode;

    expect(documentMatchesContent(schema, doc, reordered)).toBe(true);
  });

  it('does not match when the text differs', () => {
    const doc = schema.nodeFromJSON(stored('Les chiens de la voisine sont partis.'));

    expect(documentMatchesContent(schema, doc, stored('Les chien de la voisine sont partis.'))).toBe(
      false
    );
  });

  it('does not match when an attribute genuinely differs', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Titre' }] }],
    });
    const other = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Titre' }] }],
    } as ContentNode;

    expect(documentMatchesContent(schema, doc, other)).toBe(false);
  });

  it('does not match content the schema cannot parse, and does not throw', () => {
    const doc = schema.nodeFromJSON(stored('Bonjour'));
    const unparsable = { type: 'doc', content: [{ type: 'unknownBlock' }] } as ContentNode;

    expect(() => documentMatchesContent(schema, doc, unparsable)).not.toThrow();
    expect(documentMatchesContent(schema, doc, unparsable)).toBe(false);
  });
});
