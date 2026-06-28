// ABOUTME: Minimal structural type for TipTap-compatible document nodes.
// ABOUTME: Decouples the application layer from @tiptap/core.

export interface ContentMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ContentNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  marks?: ContentMark[];
  text?: string;
  [key: string]: unknown;
}
