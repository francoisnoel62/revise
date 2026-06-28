// ABOUTME: Tests for TipTapToBookHtml — verifies TipTap JSON converts to semantic HTML for the book renderer.
// ABOUTME: Only the structural/semantic output matters; presentation is the profile's responsibility.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import type { JSONContent } from '@tiptap/core';

const converter = new TipTapToBookHtml();

function doc(...children: JSONContent[]): JSONContent {
  return { type: 'doc', content: children };
}

function paragraph(text: string): JSONContent {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function heading(level: number, text: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

describe('TipTapToBookHtml', () => {
  it('converts a paragraph to <p>', () => {
    const html = converter.convert(doc(paragraph('Bonjour le monde.')));
    expect(html).toMatch(/<p[^>]*>Bonjour le monde\.<\/p>/);
  });

  it('converts a chapter heading to <h1>', () => {
    const html = converter.convert(doc(heading(1, 'Chapitre I')));
    expect(html).toMatch(/<h1[^>]*>Chapitre I<\/h1>/);
  });

  it('converts multiple paragraphs preserving order', () => {
    const html = converter.convert(doc(paragraph('Premier.'), paragraph('Deuxième.')));
    const firstIdx = html.indexOf('Premier.');
    const secondIdx = html.indexOf('Deuxième.');
    expect(firstIdx).toBeGreaterThanOrEqual(0);
    expect(secondIdx).toBeGreaterThan(firstIdx);
  });

  it('throws when content root is not a doc', () => {
    expect(() => converter.convert({ type: 'paragraph' })).toThrow(
      'Paged rendering requires a TipTap document root'
    );
  });

  it('returns valid HTML string for an empty document', () => {
    const html = converter.convert(doc());
    expect(typeof html).toBe('string');
  });
});
