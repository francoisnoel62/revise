// ABOUTME: Converts grammar-engine UTF-16 offsets within a block to ProseMirror positions.
// ABOUTME: Collects the block's text fragments from a live document and maps them.

import type { Node as ProseMirrorNode } from 'prosemirror-model';
import {
  mapBlockFragmentOffset,
  type BlockTextFragment,
} from '@/application/grammar/blockTextOffsets';

/**
 * Converts a UTF-16 offset in a block's flattened text to an absolute
 * ProseMirror document position. `blockStart` is the block position returned
 * by `Node.descendants`; its text content starts at `blockStart + 1`.
 */
export function mapBlockTextOffset(
  block: ProseMirrorNode,
  blockStart: number,
  offset: number
): number {
  const fragments: BlockTextFragment[] = [];

  block.descendants((node, relativePosition) => {
    if (!node.isText || node.text === undefined) return;
    fragments.push({ text: node.text, position: blockStart + 1 + relativePosition });
  });

  return mapBlockFragmentOffset(fragments, blockStart + 1, offset);
}
