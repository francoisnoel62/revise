// ABOUTME: Converts grammar-engine UTF-16 offsets within a block to ProseMirror positions.
// ABOUTME: Preserves the positions consumed by inline atom nodes between text fragments.

import type { Node as ProseMirrorNode } from 'prosemirror-model';

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
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError('A block text offset must be a non-negative integer.');
  }

  let textOffset = 0;
  let mappedPosition: number | undefined;
  let textEndPosition = blockStart + 1;

  block.descendants((node, relativePosition) => {
    if (!node.isText || node.text === undefined || mappedPosition !== undefined) return;

    const nextTextOffset = textOffset + node.text.length;
    if (offset >= textOffset && offset < nextTextOffset) {
      mappedPosition = blockStart + 1 + relativePosition + (offset - textOffset);
      return false;
    }

    textOffset = nextTextOffset;
    textEndPosition = blockStart + 1 + relativePosition + node.text.length;
  });

  if (mappedPosition !== undefined) return mappedPosition;
  if (offset === textOffset) return textEndPosition;

  throw new RangeError(
    `The block text offset ${offset} is outside the flattened block text of length ${textOffset}.`
  );
}
