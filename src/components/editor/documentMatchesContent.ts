// ABOUTME: Tells whether the editor's document already holds a stored chapter's content.
// ABOUTME: Compares parsed nodes so schema-filled default attributes are not read as a difference.

import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

/**
 * Whether `doc` already displays `content`.
 *
 * A stored chapter only carries the attributes it was saved with, while the
 * editor's document also carries every attribute the schema fills in by
 * default. Comparing the two as JSON therefore reports a difference that is not
 * one — and re-seeding the document on that false signal replaces it wholesale,
 * dropping the selection and every decoration attached to it.
 *
 * Parsing the stored content through the same schema applies the same defaults
 * to both sides, so only real differences remain. It also makes the comparison
 * independent of the order attributes happen to be written in.
 */
export function documentMatchesContent(
  schema: Schema,
  doc: ProseMirrorNode,
  content: ContentNode
): boolean {
  try {
    return schema.nodeFromJSON(content).eq(doc);
  } catch {
    // Content this schema cannot parse is never what the editor displays.
    return false;
  }
}
