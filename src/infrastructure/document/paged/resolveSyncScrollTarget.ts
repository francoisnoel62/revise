// ABOUTME: Pure scroll-target math mirrored by the sync-scroll handler inlined into
// ABOUTME: PagedJsRenderer's iframe script (kept in sync manually — see that file).

export interface AnchorPosition {
  readonly value: number;
  readonly top: number;
}

/**
 * Resolves the scrollTop for a given word-anchor segment + local ratio.
 *
 * Paged.js clones a block element across a page break, so the same anchor `value` can
 * appear on several DOM elements. Anchors must be looked up by `value`, never by their
 * position in a sorted array — a single split anchor shifts every later array index and
 * silently resolves the wrong boundary.
 */
export function resolveSyncScrollTarget(
  anchors: readonly AnchorPosition[],
  segmentIndex: number,
  localRatio: number,
  max: number,
): number {
  const topByValue = new Map<number, number>();
  for (const anchor of anchors) {
    if (!topByValue.has(anchor.value)) topByValue.set(anchor.value, anchor.top);
  }

  const start = segmentIndex <= 0 ? 0 : (topByValue.get(segmentIndex) ?? max);
  const end = topByValue.get(segmentIndex + 1) ?? max;
  const ratio = Math.max(0, Math.min(1, localRatio));
  return Math.max(0, Math.min(max, start + ratio * (end - start)));
}
