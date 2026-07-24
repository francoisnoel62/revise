// ABOUTME: Pure helpers for the endnote reading bubble, mirrored by the sync handler inlined
// ABOUTME: into PagedJsRenderer's iframe script (kept in sync manually — see that file).

/** Viewport-relative rectangle of a note call (from getBoundingClientRect). */
export interface AnchorRect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly top: number;
  readonly left: number;
}

/**
 * Next pinned endnote after a click. Clicking a call pins it; clicking the pinned call again
 * unpins it; clicking a different call moves the pin; a click outside any call (id === null)
 * closes whatever was open. This is what lets the bubble stay open on click yet dismiss on a
 * click elsewhere, independent of the transient hover state.
 */
export function nextOpenEndnoteId(current: string | null, clicked: string | null): string | null {
  if (clicked === null) return null;
  if (clicked === current) return null;
  return clicked;
}

/**
 * Places the floating bubble near its call, clamped to the viewport so it never spills off
 * screen. The bubble is a body-level, position: fixed element precisely so it escapes the
 * clipped Paged.js page boxes — this math therefore works in viewport coordinates.
 *
 * It sits just below the call, horizontally centered on it, and flips above when there is not
 * enough room below. Horizontally it is clamped between the margins.
 */
export function positionEndnoteBubble(
  anchor: AnchorRect,
  bubble: Size,
  viewport: Size,
  margin: number,
  gap: number,
): Point {
  const centerX = (anchor.left + anchor.right) / 2;
  const rawLeft = centerX - bubble.width / 2;
  const maxLeft = viewport.width - bubble.width - margin;
  const left = Math.max(margin, Math.min(rawLeft, maxLeft));

  const fitsBelow = anchor.bottom + gap + bubble.height <= viewport.height;
  const top = fitsBelow ? anchor.bottom + gap : anchor.top - gap - bubble.height;

  return { top, left };
}
