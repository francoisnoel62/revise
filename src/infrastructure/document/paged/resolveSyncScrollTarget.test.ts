// ABOUTME: Tests for resolveSyncScrollTarget — the piecewise scroll math for the preview iframe.
// ABOUTME: Covers the Paged.js page-break cloning bug: duplicate data-word-anchor values.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { resolveSyncScrollTarget } from './resolveSyncScrollTarget';

describe('resolveSyncScrollTarget', () => {
  it('targets the start of the document for segment 0', () => {
    const anchors = [{ value: 1, top: 1000 }];
    expect(resolveSyncScrollTarget(anchors, 0, 0, 5000)).toBe(0);
  });

  it('interpolates within a segment using the surrounding anchor boundaries', () => {
    const anchors = [
      { value: 1, top: 1000 },
      { value: 2, top: 3000 },
    ];
    expect(resolveSyncScrollTarget(anchors, 1, 0.5, 5000)).toBe(2000);
  });

  it('falls back to max when the segment has no upper anchor (last segment)', () => {
    const anchors = [{ value: 1, top: 1000 }];
    expect(resolveSyncScrollTarget(anchors, 1, 1, 5000)).toBe(5000);
  });

  it('resolves the correct boundary when an earlier anchor value is duplicated by a page break', () => {
    // Regression: Paged.js clones a block across a page break, so the SAME anchor value
    // (1) can appear on two elements. A previous implementation indexed anchors by array
    // position after sorting, so this duplicate silently shifted every later segment's
    // boundary by one, making segment 3 resolve to anchor value 2's position instead of 3's.
    const anchors = [
      { value: 1, top: 1018 }, // first page-break fragment
      { value: 1, top: 1030 }, // second page-break fragment (Paged.js clone)
      { value: 2, top: 2055 },
      { value: 3, top: 3011 },
      { value: 4, top: 4006 },
    ];

    const target = resolveSyncScrollTarget(anchors, 3, 0, 8000);

    expect(target).toBe(3011);
  });

  it('keeps the first occurrence of a duplicated anchor value', () => {
    const anchors = [
      { value: 1, top: 1018 },
      { value: 1, top: 1030 },
    ];
    expect(resolveSyncScrollTarget(anchors, 1, 0, 5000)).toBe(1018);
  });

  it('clamps the result to [0, max]', () => {
    const anchors = [{ value: 1, top: 1000 }];
    expect(resolveSyncScrollTarget(anchors, 0, 0, -10)).toBe(0);
    expect(resolveSyncScrollTarget(anchors, 1, 2, 500)).toBe(500);
  });
});
