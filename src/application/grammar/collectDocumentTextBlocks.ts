// ABOUTME: Walks a stored TipTap document into text blocks carrying ProseMirror positions.
// ABOUTME: Lets the grammar checker analyse a chapter server-side without an editor instance.

import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { BlockTextFragment } from './blockTextOffsets';

/**
 * Nodes that occupy a single position and hold no children. Every other node is
 * treated as a container, which occupies its content plus an opening and a
 * closing position — the arithmetic ProseMirror itself applies.
 *
 * The list mirrors the editor schema (StarterKit plus the endnote call). An
 * unlisted leaf would shift the positions of everything after it, which the
 * editor guards against by re-reading the text at each reported range before
 * decorating it.
 */
const LEAF_NODE_TYPES = new Set(['hardBreak', 'horizontalRule', 'image', 'endnoteRef']);

/** Characters a leaf node contributes to its block's flattened text. */
const LEAF_NODE_TEXT: Readonly<Record<string, string>> = { hardBreak: '\n' };

/** Blocks whose content is not prose and must not be handed to a grammar engine. */
const NON_PROSE_BLOCK_TYPES = new Set(['codeBlock']);

export interface DocumentTextBlock {
  /** The block's text, as the grammar engine sees it. */
  readonly text: string;
  /** Text runs paired with the absolute position of their first character. */
  readonly fragments: readonly BlockTextFragment[];
  /** Absolute position of the block's first content slot. */
  readonly textStart: number;
}

/**
 * Collects every prose block of a TipTap document, in document order, together
 * with the positions needed to turn a block-relative offset into an absolute one.
 */
export function collectDocumentTextBlocks(doc: ContentNode): DocumentTextBlock[] {
  const blocks: DocumentTextBlock[] = [];
  // The document's own children start at position 0.
  collectBlocks(doc, -1, blocks);
  return blocks;
}

function collectBlocks(
  node: ContentNode,
  nodeStart: number,
  blocks: DocumentTextBlock[]
): void {
  const fragments: BlockTextFragment[] = [];
  let hasTextChild = false;
  let childPosition = nodeStart + 1;

  for (const child of node.content ?? []) {
    if (child.type === 'text') {
      hasTextChild = true;
      if (child.text) fragments.push({ text: child.text, position: childPosition });
    } else if (LEAF_NODE_TYPES.has(child.type ?? '')) {
      const leafText = LEAF_NODE_TEXT[child.type ?? ''];
      if (leafText) fragments.push({ text: leafText, position: childPosition });
    } else {
      collectBlocks(child, childPosition, blocks);
    }

    childPosition += nodeSize(child);
  }

  if (!hasTextChild || NON_PROSE_BLOCK_TYPES.has(node.type ?? '')) return;

  const text = fragments.map((fragment) => fragment.text).join('');
  if (!text.trim()) return;

  blocks.push({ text, fragments, textStart: nodeStart + 1 });
}

function nodeSize(node: ContentNode): number {
  if (node.type === 'text') return node.text?.length ?? 0;
  if (LEAF_NODE_TYPES.has(node.type ?? '')) return 1;

  let contentSize = 0;
  for (const child of node.content ?? []) {
    contentSize += nodeSize(child);
  }
  return contentSize + 2;
}
