// ABOUTME: Pure function to migrate legacy TipTap JSON (presentation marks) to semantic content.
// ABOUTME: Idempotent: re-running on already-migrated content is a no-op.

import type { ContentNode } from '@/domain/value-objects/ContentNode';

export interface MigrationAmbiguity {
  nodeIndex: number;
  reason: string;
}

export interface MigrationResult {
  content: ContentNode;
  ambiguities: MigrationAmbiguity[];
  wasAlreadyMigrated: boolean;
}

const PRESENTATION_TEXT_ALIGN = ['left', 'right', 'justify'];
const AMBIGUOUS_TEXT_ALIGN = ['center'];

function hasTextStyleMarks(node: ContentNode): boolean {
  if (node.marks?.some((m) => m.type === 'textStyle')) return true;
  if (node.content) return node.content.some(hasTextStyleMarks);
  return false;
}

function isAlreadyMigrated(docNode: ContentNode): boolean {
  if (!docNode.content?.length) return true;
  return docNode.content.every((node) => {
    if (node.type === 'paragraph') {
      return typeof node.attrs?.semanticRole === 'string' && !hasTextStyleMarks(node);
    }
    if (node.type === 'heading') {
      const expectedRole =
        node.attrs?.level === 1 ? 'titre-de-chapitre' : 'sous-titre';
      return node.attrs?.semanticRole === expectedRole && !hasTextStyleMarks(node);
    }
    return true;
  });
}

function stripTextStyleFromNode(node: ContentNode): ContentNode {
  const strippedMarks = node.marks?.filter((m) => m.type !== 'textStyle');
  const strippedContent = node.content?.map(stripTextStyleFromNode);

  return {
    ...node,
    ...(node.marks !== undefined
      ? { marks: strippedMarks?.length ? strippedMarks : undefined }
      : {}),
    ...(node.content !== undefined ? { content: strippedContent } : {}),
  };
}

function migrateParagraph(
  node: ContentNode,
  nodeIndex: number,
  ambiguities: MigrationAmbiguity[]
): ContentNode {
  const textAlign = node.attrs?.textAlign as string | undefined;
  const isCenter = AMBIGUOUS_TEXT_ALIGN.includes(textAlign ?? '');

  if (isCenter) {
    ambiguities.push({
      nodeIndex,
      reason: `Paragraphe centré (textAlign: center) — rôle ambigu, classifié comme corps. Vérifier si c'est une épigraphe.`,
    });
  }

  const attrs: Record<string, unknown> = {
    ...(node.attrs ?? {}),
    semanticRole: node.attrs?.semanticRole ?? 'corps',
  };

  if (textAlign && PRESENTATION_TEXT_ALIGN.includes(textAlign)) {
    delete attrs.textAlign;
  }

  return {
    ...stripTextStyleFromNode(node),
    attrs,
  };
}

function migrateHeading(node: ContentNode): ContentNode {
  const attrs: Record<string, unknown> = { ...(node.attrs ?? {}) };
  delete attrs.textAlign;

  // A level-1 heading is a chapter title; every deeper heading is a subtitle.
  // Citation and epigraphe are body text (paragraphs), never headings, so a
  // heading's role is always unambiguous.
  attrs.semanticRole = attrs.level === 1 ? 'titre-de-chapitre' : 'sous-titre';

  return {
    ...stripTextStyleFromNode(node),
    attrs,
  };
}

export function migrateContent(content: ContentNode): MigrationResult {
  if (isAlreadyMigrated(content)) {
    return {
      content,
      ambiguities: [],
      wasAlreadyMigrated: true,
    };
  }

  const ambiguities: MigrationAmbiguity[] = [];

  const migratedNodes = (content.content ?? []).map((node, index) => {
    if (node.type === 'paragraph') {
      return migrateParagraph(node, index, ambiguities);
    }
    if (node.type === 'heading') {
      return migrateHeading(node);
    }
    // horizontalRule is its own semantic marker (séparateur-de-scène) by node type — no attr needed.
    return node;
  });

  return {
    content: { ...content, content: migratedNodes },
    ambiguities,
    wasAlreadyMigrated: false,
  };
}
