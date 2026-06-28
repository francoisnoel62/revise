// ABOUTME: Pure functions for the presentation override layer (passerelle profile).
// ABOUTME: apply/strip/extract are the three primitives for the round-trip invariant.

import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { PresentationOverrideLayer, PresentationProps } from '@/domain/value-objects/PresentationOverride';

const PRESENTATION_ATTRS = ['fontFamily', 'fontSize', 'textAlign'] as const;
type PresentationAttr = (typeof PRESENTATION_ATTRS)[number];

/**
 * Merge a presentation override layer onto a semantic document.
 * Nodes not targeted by any override are returned unchanged.
 */
export function applyOverrides(
  doc: ContentNode,
  overrides: PresentationOverrideLayer
): ContentNode {
  if (!overrides.length || !doc.content) return doc;

  const byIndex = new Map(overrides.map((o) => [o.nodeIndex, o.props]));

  const content = doc.content.map((node, i) => {
    const props = byIndex.get(i);
    if (!props) return node;

    const presentationEntries = Object.entries(props).filter(
      ([, v]) => v !== undefined
    );
    if (!presentationEntries.length) return node;

    return {
      ...node,
      attrs: {
        ...node.attrs,
        ...Object.fromEntries(presentationEntries),
      },
    };
  });

  return { ...doc, content };
}

/**
 * Remove all presentation attrs from every node, leaving only semantic content.
 * This is the inverse of applyOverrides and must satisfy:
 *   stripToSemantic(applyOverrides(semantic, overrides)) === semantic
 */
export function stripToSemantic(doc: ContentNode): ContentNode {
  if (!doc.content) return doc;

  const content = doc.content.map((node) => {
    if (!node.attrs) return node;

    const cleanAttrs = { ...node.attrs };
    for (const attr of PRESENTATION_ATTRS) {
      delete cleanAttrs[attr];
    }

    return { ...node, attrs: cleanAttrs };
  });

  return { ...doc, content };
}

/**
 * Extract the presentation override layer from a "presented" document.
 * Returns only nodes that actually carry at least one presentation prop.
 */
export function extractOverrides(doc: ContentNode): PresentationOverrideLayer {
  if (!doc.content) return [];

  const overrides: PresentationOverrideLayer = [];

  doc.content.forEach((node, i) => {
    if (!node.attrs) return;

    const props: PresentationProps = {};
    for (const attr of PRESENTATION_ATTRS) {
      const val = node.attrs[attr as PresentationAttr];
      if (typeof val === 'string') {
        props[attr as PresentationAttr] = val;
      }
    }

    if (Object.keys(props).length > 0) {
      overrides.push({ nodeIndex: i, props });
    }
  });

  return overrides;
}
