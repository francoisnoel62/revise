// ABOUTME: Assigns stable, index-based anchor ids to a chapter's top-level sous-titre headings.
// ABOUTME: Shared by WholeBookHtmlAssembler (HTML tagging) and book-preview-actions (nav titles).

import type { JSONContent } from '@tiptap/core';
import type { TocSubEntry } from '@/application/interfaces/PagedRenderer';

export interface TaggedSubtitles {
  readonly content: JSONContent;
  readonly subEntries: readonly TocSubEntry[];
}

/** Tags each top-level sous-titre heading with `${chapterAnchorId}-soustitre-${index}` and collects its title. */
export function tagSubtitleHeadings(content: JSONContent, chapterAnchorId: string): TaggedSubtitles {
  const subEntries: TocSubEntry[] = [];
  let index = 0;

  const taggedNodes = (content.content ?? []).map((node) => {
    if (node.type !== 'heading' || node.attrs?.semanticRole !== 'sous-titre') return node;

    const anchorId = `${chapterAnchorId}-soustitre-${index}`;
    index += 1;
    subEntries.push({ anchorId, title: extractText(node) });

    return { ...node, attrs: { ...node.attrs, id: anchorId } };
  });

  return { content: { ...content, content: taggedNodes }, subEntries };
}

function extractText(node: JSONContent): string {
  return (node.content ?? [])
    .map((child) => (child.type === 'text' ? (child.text ?? '') : extractText(child)))
    .join('');
}
