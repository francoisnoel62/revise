// ABOUTME: Pure function to migrate legacy TipTap JSON (presentation marks) to semantic content.
// ABOUTME: Idempotent: re-running on already-migrated content is a no-op.

import type { JSONContent } from '@tiptap/core';

export interface MigrationAmbiguity {
  nodeIndex: number;
  reason: string;
}

export interface MigrationResult {
  content: JSONContent;
  ambiguities: MigrationAmbiguity[];
  wasAlreadyMigrated: boolean;
}

const PRESENTATION_TEXT_ALIGN = ['left', 'right', 'justify'];
const AMBIGUOUS_TEXT_ALIGN = ['center'];

function hasTextStyleMarks(node: JSONContent): boolean {
  if (node.marks?.some((m) => m.type === 'textStyle')) return true;
  if (node.content) return node.content.some(hasTextStyleMarks);
  return false;
}

function isAlreadyMigrated(docNode: JSONContent): boolean {
  if (!docNode.content?.length) return true;
  return docNode.content.every((node) => {
    if (node.type === 'paragraph') {
      return typeof node.attrs?.semanticRole === 'string' && !hasTextStyleMarks(node);
    }
    if (node.type === 'heading') {
      const hasRole = node.attrs?.level !== 1 || node.attrs?.semanticRole === 'titre-de-chapitre';
      return hasRole && !hasTextStyleMarks(node);
    }
    return true;
  });
}

function stripTextStyleFromNode(node: JSONContent): JSONContent {
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
  node: JSONContent,
  nodeIndex: number,
  ambiguities: MigrationAmbiguity[]
): JSONContent {
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

function migrateHeading(node: JSONContent): JSONContent {
  const attrs: Record<string, unknown> = { ...(node.attrs ?? {}) };
  delete attrs.textAlign;

  if (attrs.level === 1) {
    attrs.semanticRole = 'titre-de-chapitre';
  }

  return {
    ...stripTextStyleFromNode(node),
    attrs,
  };
}

export function migrateContent(content: JSONContent): MigrationResult {
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
    return node;
  });

  return {
    content: { ...content, content: migratedNodes },
    ambiguities,
    wasAlreadyMigrated: false,
  };
}
