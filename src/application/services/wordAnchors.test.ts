// ABOUTME: Tests for wordAnchors — splits a chapter into fixed-size word segments for scroll sync.
// ABOUTME: Shared by the editor scroll listener and the preview HTML tagging step.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { computeAnchorBlockIndices, tagWordAnchors } from './wordAnchors';

const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

const words = (count: number, prefix = 'mot'): string =>
  Array.from({ length: count }, (_, i) => `${prefix}${i}`).join(' ');

describe('computeAnchorBlockIndices', () => {
  it('returns no anchors when the total word count never reaches the threshold', () => {
    expect(computeAnchorBlockIndices([200, 300, 400], 1000)).toEqual([]);
  });

  it('returns the block index where cumulative word count first reaches each threshold', () => {
    // cumulative: 400, 900, 1100, 1600, 2200
    expect(computeAnchorBlockIndices([400, 500, 200, 500, 600], 1000)).toEqual([2, 4]);
  });

  it('dedupes when a single block alone crosses several thresholds', () => {
    // cumulative: 100, 2600 (block 1 alone jumps past 1000 and 2000)
    expect(computeAnchorBlockIndices([100, 2500], 1000)).toEqual([1]);
  });

  it('returns one anchor per block when blocks land exactly on the threshold', () => {
    expect(computeAnchorBlockIndices([1000, 1000, 1000], 1000)).toEqual([0, 1, 2]);
  });
});

describe('tagWordAnchors', () => {
  it('tags no block when the chapter has fewer words than the threshold', () => {
    const content: JSONContent = { type: 'doc', content: [paragraph(words(50))] };
    const { content: tagged, anchorCount } = tagWordAnchors(content, 1000);
    expect(anchorCount).toBe(0);
    expect(tagged.content?.[0].attrs?.wordAnchor).toBeUndefined();
  });

  it('tags the block that crosses the 1000-word threshold with anchor index 1', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [paragraph(words(600)), paragraph(words(600))],
    };
    const { content: tagged, anchorCount } = tagWordAnchors(content, 1000);
    expect(anchorCount).toBe(1);
    expect(tagged.content?.[0].attrs?.wordAnchor).toBeUndefined();
    expect(tagged.content?.[1].attrs?.wordAnchor).toBe(1);
  });

  it('tags multiple thresholds across several blocks with increasing anchor indices', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [paragraph(words(600)), paragraph(words(600)), paragraph(words(900))],
    };
    // cumulative: 600, 1200, 2100
    const { content: tagged, anchorCount } = tagWordAnchors(content, 1000);
    expect(anchorCount).toBe(2);
    expect(tagged.content?.[1].attrs?.wordAnchor).toBe(1);
    expect(tagged.content?.[2].attrs?.wordAnchor).toBe(2);
  });

  it('does not mutate the original content', () => {
    const content: JSONContent = { type: 'doc', content: [paragraph(words(1200))] };
    tagWordAnchors(content, 1000);
    expect(content.content?.[0].attrs?.wordAnchor).toBeUndefined();
  });

  it('counts words across nested inline nodes', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `${words(500)} ` },
            { type: 'text', text: words(600), marks: [{ type: 'bold' }] },
          ],
        },
        paragraph('encore un mot'),
      ],
    };
    const { content: tagged } = tagWordAnchors(content, 1000);
    expect(tagged.content?.[0].attrs?.wordAnchor).toBe(1);
  });
});
