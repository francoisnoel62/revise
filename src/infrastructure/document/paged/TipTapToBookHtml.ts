// ABOUTME: Converts TipTap JSON into the semantic HTML consumed by the book renderer.
// ABOUTME: Preserves author content while leaving all presentation to publication profiles.

import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

export class TipTapToBookHtml {
  convert(content: JSONContent): string {
    if (content.type !== 'doc') {
      throw new Error('Paged rendering requires a TipTap document root');
    }

    return generateHTML(content, [StarterKit]);
  }
}
