// ABOUTME: Locks the author's data-indent choice through the live publication-preview pipeline.
// ABOUTME: switchPublicationProfile → tagWordAnchors → TipTapToBookHtml must keep indent on a body paragraph.

import { describe, expect, it } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import { switchPublicationProfile } from '../PublicationProfileSwitch';
import { tagWordAnchors } from '@/application/services/wordAnchors';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

// Mirrors what PublicationPreview does for every keystroke: strip to semantic content for a
// print-ready profile, tag word anchors, then convert to book HTML. An author who toggles the
// first-line indent on the paragraph right after a sous-titre must see that choice reach the
// rendered HTML as data-indent="true" — otherwise the BookCssBuilder rule that restores the
// indent has nothing to hook onto and the pre-commit behaviour stays broken for real users.
const authoredContent: ContentNode = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2, semanticRole: 'sous-titre' },
      content: [{ type: 'text', text: 'Sous-titre' }],
    },
    {
      type: 'paragraph',
      attrs: { semanticRole: 'corps', indent: true },
      content: [{ type: 'text', text: 'Ce paragraphe doit rester indenté après le sous-titre.' }],
    },
  ],
};

describe('first-line indent round-trip through the publication-preview pipeline', () => {
  it('keeps data-indent on the body paragraph after switch + word-anchor tagging + conversion', () => {
    const { content: semantic } = switchPublicationProfile(authoredContent, 'kdp-6x9', []);
    const { content: tagged } = tagWordAnchors(semantic as JSONContent, 250);
    const html = new TipTapToBookHtml().convert(tagged);

    expect(html).toContain('data-indent="true"');
    // The indent must live on the corps paragraph, not have leaked onto the heading.
    expect(html).toMatch(/<p[^>]*data-semantic-role="corps"[^>]*data-indent="true"/);
  });
});
