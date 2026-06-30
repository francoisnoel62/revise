// ABOUTME: Converts a plain-text AI proposition into TipTap semantic content.
// ABOUTME: Ensures insertion preserves or creates semantic roles on all paragraph nodes.

import type { ContentNode } from '@/domain/value-objects/ContentNode';
import { isSemanticRole, type SemanticRole } from '@/domain/value-objects/SemanticRole';

/** Either a plain string (for inline insertion) or an array of semantic paragraph nodes. */
export type InsertableContent = string | ContentNode[];

/**
 * Reads the semanticRole from a block node's attrs, falling back to 'corps'.
 * Keeps the validation rule in the Application layer rather than in UI components.
 */
export function getSemanticRoleFromAttrs(
  attrs: Record<string, unknown> | undefined
): SemanticRole {
  const role = attrs?.semanticRole;
  return isSemanticRole(role) ? role : 'corps';
}

/**
 * Converts an AI proposition (plain text) into content safe for semantic insertion.
 *
 * - Single-paragraph text (no blank-line separators): returned as a trimmed string.
 *   TipTap inserts it inline within the host block, which retains the block's
 *   existing `semanticRole` — no structural change needed.
 *
 * - Multi-paragraph text (separated by one or more blank lines): converted to an
 *   array of paragraph ContentNodes, each bearing the supplied `semanticRole`.
 */
export function buildSemanticInsertContent(
  proposalText: string,
  semanticRole: SemanticRole
): InsertableContent {
  const paragraphs = proposalText
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length <= 1) {
    return proposalText.replace(/\n/g, ' ').trim();
  }

  return paragraphs.map(
    (para): ContentNode => ({
      type: 'paragraph',
      attrs: { semanticRole },
      content: [{ type: 'text', text: para }],
    })
  );
}
