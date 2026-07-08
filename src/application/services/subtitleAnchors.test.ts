// ABOUTME: Tests for tagSubtitleHeadings — assigns stable anchor ids to sous-titre headings.
// ABOUTME: Shared by WholeBookHtmlAssembler (HTML tagging) and book-preview-actions (nav titles).
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { tagSubtitleHeadings } from './subtitleAnchors';

const titre = (text: string): JSONContent => ({
  type: 'heading',
  attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
  content: [{ type: 'text', text }],
});

const sousTitre = (text: string): JSONContent => ({
  type: 'heading',
  attrs: { level: 2, semanticRole: 'sous-titre' },
  content: [{ type: 'text', text }],
});

const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('tagSubtitleHeadings', () => {
  it('returns no subEntries when the chapter has no sous-titre heading', () => {
    const content: JSONContent = { type: 'doc', content: [titre('Chapitre 1'), paragraph('Corps.')] };
    const { subEntries } = tagSubtitleHeadings(content, 'chapter-ch1');
    expect(subEntries).toEqual([]);
  });

  it('assigns a stable, index-based anchor id to each sous-titre heading', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [titre('Chapitre 1'), sousTitre('Un'), paragraph('a'), sousTitre('Deux'), paragraph('b')],
    };
    const { subEntries } = tagSubtitleHeadings(content, 'chapter-ch1');
    expect(subEntries).toEqual([
      { anchorId: 'chapter-ch1-soustitre-0', title: 'Un' },
      { anchorId: 'chapter-ch1-soustitre-1', title: 'Deux' },
    ]);
  });

  it('tags the returned content nodes with a matching attrs.id', () => {
    const content: JSONContent = { type: 'doc', content: [titre('Chapitre 1'), sousTitre('Un')] };
    const { content: tagged } = tagSubtitleHeadings(content, 'chapter-ch1');
    const heading = tagged.content?.[1];
    expect(heading?.attrs?.id).toBe('chapter-ch1-soustitre-0');
  });

  it('does not mutate the original content', () => {
    const content: JSONContent = { type: 'doc', content: [sousTitre('Un')] };
    tagSubtitleHeadings(content, 'chapter-ch1');
    expect(content.content?.[0].attrs?.id).toBeUndefined();
  });

  it('extracts plain text across nested inline nodes', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, semanticRole: 'sous-titre' },
          content: [
            { type: 'text', text: 'Un ' },
            { type: 'text', text: 'mot', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    };
    const { subEntries } = tagSubtitleHeadings(content, 'chapter-ch1');
    expect(subEntries).toEqual([{ anchorId: 'chapter-ch1-soustitre-0', title: 'Un mot' }]);
  });
});
