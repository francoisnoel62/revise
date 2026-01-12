// ABOUTME: Serialization utilities for CorrectionHistory <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { CorrectionHistory } from '@/domain/entities/CorrectionHistory';

/**
 * MongoDB document shape for CorrectionHistory.
 */
export interface CorrectionHistoryDocument {
  _id: string;
  projectId: string;
  chapterId: string;
  ownerId: string;
  selectedText: string;
  proposals: string[];
  createdAt: Date;
}

/**
 * Convert CorrectionHistory domain entity to MongoDB document.
 */
export function serializeCorrectionHistory(
  history: CorrectionHistory,
  ownerId: string
): CorrectionHistoryDocument {
  return {
    _id: history.getId(),
    projectId: history.getProjectId(),
    chapterId: history.getChapterId(),
    ownerId,
    selectedText: history.getSelectedText(),
    proposals: history.getProposals(),
    createdAt: history.getCreatedAt(),
  };
}

/**
 * Reconstruct CorrectionHistory domain entity from MongoDB document.
 */
export function deserializeCorrectionHistory(
  doc: CorrectionHistoryDocument
): CorrectionHistory {
  return new CorrectionHistory(
    doc._id,
    doc.projectId,
    doc.chapterId,
    doc.selectedText,
    doc.proposals,
    new Date(doc.createdAt)
  );
}
