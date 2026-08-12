// ABOUTME: Maps a UTF-16 offset in a block's flattened text to an absolute ProseMirror position.
// ABOUTME: Works on text fragments so both the live editor and a stored document can reuse it.

/**
 * A run of characters inside one block, paired with the absolute ProseMirror
 * position of its first character. Positions that carry no text — inline atoms
 * such as an endnote call — simply leave a gap between two fragments.
 */
export interface BlockTextFragment {
  readonly text: string;
  readonly position: number;
}

/**
 * Converts a UTF-16 offset in the concatenation of `fragments` to an absolute
 * ProseMirror position.
 *
 * @param blockTextStart - position of the block's first content slot, returned
 *   for offset 0 of a block that holds no text at all.
 */
export function mapBlockFragmentOffset(
  fragments: readonly BlockTextFragment[],
  blockTextStart: number,
  offset: number
): number {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError('A block text offset must be a non-negative integer.');
  }

  let textOffset = 0;
  let textEndPosition = blockTextStart;

  for (const fragment of fragments) {
    const nextTextOffset = textOffset + fragment.text.length;
    if (offset < nextTextOffset) {
      return fragment.position + (offset - textOffset);
    }

    textOffset = nextTextOffset;
    textEndPosition = fragment.position + fragment.text.length;
  }

  if (offset === textOffset) return textEndPosition;

  throw new RangeError(
    `The block text offset ${offset} is outside the flattened block text of length ${textOffset}.`
  );
}
