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

  convertChapter(content: JSONContent, chapterTitle: string): string {
    if (content.type !== 'doc') {
      throw new Error('Paged rendering requires a TipTap document root');
    }

    const children = content.content ?? [];
    const stripped = this.startsWithTitleHeading(children, chapterTitle)
      ? { ...content, content: children.slice(1) }
      : content;

    return generateHTML(stripped, [StarterKit]);
  }

  private startsWithTitleHeading(nodes: JSONContent[], title: string): boolean {
    const first = nodes[0];
    if (!first || first.type !== 'heading') return false;
    const text = (first.content ?? [])
      .filter((n) => n.type === 'text')
      .map((n) => n.text ?? '')
      .join('');
    return text.trim().toLowerCase() === title.trim().toLowerCase();
  }
}
