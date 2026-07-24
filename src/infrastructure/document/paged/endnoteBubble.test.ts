// ABOUTME: Tests for the pure endnote-bubble helpers mirrored by PagedJsRenderer's iframe script.
// ABOUTME: Covers click pin/toggle state and viewport-clamped placement of the floating bubble.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { nextOpenEndnoteId, positionEndnoteBubble } from './endnoteBubble';

describe('nextOpenEndnoteId', () => {
  it('opens a note when none is pinned', () => {
    expect(nextOpenEndnoteId(null, 'a')).toBe('a');
  });

  it('toggles the pinned note off when its own call is clicked again', () => {
    expect(nextOpenEndnoteId('a', 'a')).toBeNull();
  });

  it('switches the pin to another call when a different one is clicked', () => {
    expect(nextOpenEndnoteId('a', 'b')).toBe('b');
  });

  it('closes the pinned note when the click lands outside any call', () => {
    expect(nextOpenEndnoteId('a', null)).toBeNull();
  });

  it('stays closed when clicking outside with nothing pinned', () => {
    expect(nextOpenEndnoteId(null, null)).toBeNull();
  });
});

describe('positionEndnoteBubble', () => {
  const viewport = { width: 1000, height: 800 };
  const bubble = { width: 240, height: 100 };
  const margin = 8;
  const gap = 6;

  it('places the bubble below the call, horizontally centered on it, when there is room', () => {
    const anchor = { left: 480, right: 500, top: 300, bottom: 316 };
    const { top, left } = positionEndnoteBubble(anchor, bubble, viewport, margin, gap);
    // centered on the anchor's midpoint (490) minus half the bubble width
    expect(left).toBe(490 - bubble.width / 2);
    // just below the call
    expect(top).toBe(anchor.bottom + gap);
  });

  it('flips the bubble above the call when there is not enough room below', () => {
    const anchor = { left: 480, right: 500, top: 740, bottom: 756 };
    const { top } = positionEndnoteBubble(anchor, bubble, viewport, margin, gap);
    // not enough room below (756 + 6 + 100 > 800) → placed above the call
    expect(top).toBe(anchor.top - gap - bubble.height);
  });

  it('clamps the bubble to the left margin when the call sits near the left edge', () => {
    const anchor = { left: 0, right: 12, top: 300, bottom: 316 };
    const { left } = positionEndnoteBubble(anchor, bubble, viewport, margin, gap);
    expect(left).toBe(margin);
  });

  it('clamps the bubble to the right margin when the call sits near the right edge', () => {
    const anchor = { left: 988, right: 1000, top: 300, bottom: 316 };
    const { left } = positionEndnoteBubble(anchor, bubble, viewport, margin, gap);
    expect(left).toBe(viewport.width - bubble.width - margin);
  });
});
