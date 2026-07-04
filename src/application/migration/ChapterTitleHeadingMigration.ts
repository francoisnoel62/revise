// ABOUTME: Inserts a missing titre-de-chapitre H1 into a chapter body (one-shot migration, #143).
// ABOUTME: Idempotent — a chapter already starting with the semantic heading is left untouched.

import type { ContentNode } from '@/domain/value-objects/ContentNode';

export interface ChapterTitleHeadingResult {
  content: ContentNode;
  wasAlreadyPresent: boolean;
}

function startsWithTitreDeChapitre(nodes: ContentNode[]): boolean {
  const first = nodes[0];
  return !!first && first.type === 'heading' && first.attrs?.semanticRole === 'titre-de-chapitre';
}

/**
 * Ensures the chapter body starts with a `titre-de-chapitre` H1, inserting one
 * (text = chapterTitle) when absent. No-op when already present.
 */
export function ensureChapterTitleHeading(
  content: ContentNode,
  chapterTitle: string
): ChapterTitleHeadingResult {
  const nodes = content.content ?? [];

  if (startsWithTitreDeChapitre(nodes)) {
    return { content, wasAlreadyPresent: true };
  }

  const heading: ContentNode = {
    type: 'heading',
    attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
    content: [{ type: 'text', text: chapterTitle }],
  };

  return {
    content: { ...content, content: [heading, ...nodes] },
    wasAlreadyPresent: false,
  };
}
