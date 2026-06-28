// ABOUTME: Inverse of ContentMigrator — strips semanticRole attributes from content nodes.
// ABOUTME: Enables data rollback; does not restore presentation marks stripped during migration.

import type { ContentNode } from '@/domain/value-objects/ContentNode';

export interface DemigrationResult {
  content: ContentNode;
  nodesReverted: number;
}

function revertNode(node: ContentNode): { node: ContentNode; count: number } {
  let count = 0;

  let attrs = node.attrs;
  if (attrs && 'semanticRole' in attrs) {
    const newAttrs = { ...attrs };
    delete newAttrs['semanticRole'];
    attrs = newAttrs;
    count++;
  }

  let content = node.content;
  if (node.content) {
    const results = node.content.map(revertNode);
    content = results.map((r) => r.node);
    count += results.reduce((sum, r) => sum + r.count, 0);
  }

  return {
    node: {
      ...node,
      ...(attrs !== node.attrs ? { attrs } : {}),
      ...(content !== node.content ? { content } : {}),
    },
    count,
  };
}

export function demigrateContent(content: ContentNode): DemigrationResult {
  const { node, count } = revertNode(content);
  return {
    content: node,
    nodesReverted: count,
  };
}
