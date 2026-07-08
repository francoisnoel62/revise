// ABOUTME: Interface for converting a TipTap document into the semantic HTML the book renderer consumes.
// ABOUTME: Decouples whole-book HTML assembly from the specific TipTap-to-HTML implementation.

import type { JSONContent } from '@tiptap/core';

export interface TipTapToHtmlConverter {
  convert(content: JSONContent): string;
}
