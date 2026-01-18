// ABOUTME: Serialization utilities for SpellCheckCache <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { SpellCheckCache } from '@/domain/entities/SpellCheckCache';
import { SpellCheckCorrection, CorrectionType } from '@/domain/value-objects/SpellCheckCorrection';

/**
 * MongoDB document shape for a single correction.
 */
export interface CorrectionDocument {
  original: string;
  corrected: string;
  type: CorrectionType;
  explanation: string;
}

/**
 * MongoDB document shape for SpellCheckCache.
 */
export interface SpellCheckCacheDocument {
  _id: string;
  chapterId: string;
  projectId: string;
  ownerId: string;
  contentHash: string;
  corrections: CorrectionDocument[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert SpellCheckCache domain entity to MongoDB document.
 */
export function serializeSpellCheckCache(
  cache: SpellCheckCache,
  ownerId: string
): SpellCheckCacheDocument {
  return {
    _id: cache.getId(),
    chapterId: cache.getChapterId(),
    projectId: cache.getProjectId(),
    ownerId,
    contentHash: cache.getContentHash(),
    corrections: cache.getCorrections().map((c) => ({
      original: c.original,
      corrected: c.corrected,
      type: c.type,
      explanation: c.explanation,
    })),
    createdAt: cache.getCreatedAt(),
    updatedAt: cache.getUpdatedAt(),
  };
}

/**
 * Reconstruct SpellCheckCache domain entity from MongoDB document.
 */
export function deserializeSpellCheckCache(
  doc: SpellCheckCacheDocument
): SpellCheckCache {
  const corrections = doc.corrections.map(
    (c) =>
      new SpellCheckCorrection({
        original: c.original,
        corrected: c.corrected,
        type: c.type,
        explanation: c.explanation,
      })
  );

  return new SpellCheckCache(
    doc._id,
    doc.chapterId,
    doc.projectId,
    doc.contentHash,
    corrections,
    new Date(doc.createdAt),
    new Date(doc.updatedAt)
  );
}
