// ABOUTME: Splits a chapter's top-level blocks into fixed-size word segments for scroll sync.
// ABOUTME: Shared by the editor scroll listener (position lookup) and the preview HTML tagging step.

import type { JSONContent } from '@tiptap/core';

export interface TaggedWordAnchors {
  readonly content: JSONContent;
  /** Number of word-count thresholds actually reached (0 for short chapters). */
  readonly anchorCount: number;
}

/**
 * Given the word count of each top-level block (in document order), returns the block
 * index where cumulative word count first reaches each multiple of `everyNWords`.
 * A single block spanning several thresholds only yields one anchor (the block it lands in).
 */
export function computeAnchorBlockIndices(
  blockWordCounts: readonly number[],
  everyNWords: number,
): number[] {
  const indices: number[] = [];
  let cumulative = 0;
  let nextThreshold = everyNWords;

  blockWordCounts.forEach((count, index) => {
    cumulative += count;
    if (cumulative < nextThreshold) return;
    indices.push(index);
    while (cumulative >= nextThreshold) nextThreshold += everyNWords;
  });

  return indices;
}

/** Tags each top-level block that crosses a word-count threshold with `attrs.wordAnchor = index (1-based)`. */
export function tagWordAnchors(content: JSONContent, everyNWords: number): TaggedWordAnchors {
  const blocks = content.content ?? [];
  const blockWordCounts = blocks.map((node) => countWords(extractText(node)));
  const anchorBlockIndices = computeAnchorBlockIndices(blockWordCounts, everyNWords);
  const anchorBlockIndexSet = new Set(anchorBlockIndices);

  const taggedNodes = blocks.map((node, index) => {
    if (!anchorBlockIndexSet.has(index)) return node;
    const anchorIndex = anchorBlockIndices.indexOf(index) + 1;
    return { ...node, attrs: { ...node.attrs, wordAnchor: anchorIndex } };
  });

  return { content: { ...content, content: taggedNodes }, anchorCount: anchorBlockIndices.length };
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractText(node: JSONContent): string {
  return (node.content ?? [])
    .map((child) => (child.type === 'text' ? (child.text ?? '') : extractText(child)))
    .join(' ');
}
