// ABOUTME: Unit tests for mapping a flattened block text offset onto a ProseMirror position.
// ABOUTME: Drives the fragment-based core shared by the editor and the server-side walker.

import { describe, expect, it } from 'vitest';
import { mapBlockFragmentOffset, type BlockTextFragment } from '../blockTextOffsets';

describe('mapBlockFragmentOffset', () => {
  it('maps an offset inside a single fragment', () => {
    const fragments: BlockTextFragment[] = [{ text: 'bonjour', position: 11 }];

    expect(mapBlockFragmentOffset(fragments, 11, 0)).toBe(11);
    expect(mapBlockFragmentOffset(fragments, 11, 4)).toBe(15);
  });

  it('maps the end offset to the position after the last character', () => {
    const fragments: BlockTextFragment[] = [{ text: 'bonjour', position: 11 }];

    expect(mapBlockFragmentOffset(fragments, 11, 7)).toBe(18);
  });

  it('maps offsets across fragments separated by positions carrying no text', () => {
    // 'ab' at 21-22, an inline atom at 23, 'cd' at 24-25.
    const fragments: BlockTextFragment[] = [
      { text: 'ab', position: 21 },
      { text: 'cd', position: 24 },
    ];

    expect(mapBlockFragmentOffset(fragments, 21, 2)).toBe(24);
    expect(mapBlockFragmentOffset(fragments, 21, 4)).toBe(26);
  });

  it('maps offset zero of an empty block to the block text start', () => {
    expect(mapBlockFragmentOffset([], 8, 0)).toBe(8);
  });

  it('rejects an offset beyond the flattened block text', () => {
    const fragments: BlockTextFragment[] = [{ text: 'ab', position: 21 }];

    expect(() => mapBlockFragmentOffset(fragments, 21, 3)).toThrow(RangeError);
  });

  it('rejects offsets that are not non-negative integers', () => {
    const fragments: BlockTextFragment[] = [{ text: 'ab', position: 21 }];

    expect(() => mapBlockFragmentOffset(fragments, 21, -1)).toThrow(RangeError);
    expect(() => mapBlockFragmentOffset(fragments, 21, 1.5)).toThrow(RangeError);
  });
});
