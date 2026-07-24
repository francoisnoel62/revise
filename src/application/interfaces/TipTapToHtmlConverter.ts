// ABOUTME: Interface for converting a TipTap document into the semantic HTML the book renderer consumes.
// ABOUTME: Decouples whole-book HTML assembly from the specific TipTap-to-HTML implementation.

import type { JSONContent } from '@tiptap/core';

export interface ConvertOptions {
  /**
   * When set, endnote calls are rendered as round-trip anchors (id + link to their compiled note)
   * scoped to this prefix, instead of the reading-view superscript. Used by the paged export, whose
   * back matter compiles the notes. Absent for reading views, which reveal notes in a hover bubble.
   */
  readonly endnoteAnchorPrefix?: string;
}

export interface TipTapToHtmlConverter {
  convert(content: JSONContent, options?: ConvertOptions): string;
}
