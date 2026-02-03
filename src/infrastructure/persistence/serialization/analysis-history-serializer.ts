// ABOUTME: Serialization utilities for AnalysisHistory <-> MongoDB document conversion.
// ABOUTME: Handles applied corrections and ignored issues tracking.

import { AnalysisHistory, AppliedCorrection } from '@/domain/entities/AnalysisHistory';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';

/**
 * MongoDB document shape for AppliedCorrection.
 */
export interface AppliedCorrectionDocument {
  issueId: string;
  originalText: string;
  appliedText: string;
  appliedAt: Date;
}

/**
 * MongoDB document shape for AnalysisHistory.
 */
export interface AnalysisHistoryDocument {
  _id: string;
  chapterId: string;
  projectId: string;
  ownerId: string;
  originalContent: string;
  totalIssuesFound: number;
  categoriesAnalyzed: AnalysisCategory[];
  appliedCorrections: AppliedCorrectionDocument[];
  ignoredIssueIds: string[];
  createdAt: Date;
}

/**
 * Convert AppliedCorrection to document format.
 */
function serializeAppliedCorrection(correction: AppliedCorrection): AppliedCorrectionDocument {
  return {
    issueId: correction.issueId,
    originalText: correction.originalText,
    appliedText: correction.appliedText,
    appliedAt: correction.appliedAt,
  };
}

/**
 * Reconstruct AppliedCorrection from document.
 */
function deserializeAppliedCorrection(doc: AppliedCorrectionDocument): AppliedCorrection {
  return {
    issueId: doc.issueId,
    originalText: doc.originalText,
    appliedText: doc.appliedText,
    appliedAt: new Date(doc.appliedAt),
  };
}

/**
 * Convert AnalysisHistory domain entity to MongoDB document.
 */
export function serializeAnalysisHistory(
  history: AnalysisHistory,
  ownerId: string
): AnalysisHistoryDocument {
  return {
    _id: history.getId(),
    chapterId: history.getChapterId(),
    projectId: history.getProjectId(),
    ownerId,
    originalContent: history.getOriginalContent(),
    totalIssuesFound: history.getTotalIssuesFound(),
    categoriesAnalyzed: history.getCategoriesAnalyzed(),
    appliedCorrections: history.getAppliedCorrections().map(serializeAppliedCorrection),
    ignoredIssueIds: history.getIgnoredIssueIds(),
    createdAt: history.getCreatedAt(),
  };
}

/**
 * Reconstruct AnalysisHistory domain entity from MongoDB document.
 */
export function deserializeAnalysisHistory(doc: AnalysisHistoryDocument): AnalysisHistory {
  return new AnalysisHistory({
    id: doc._id,
    chapterId: doc.chapterId,
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    originalContent: doc.originalContent,
    totalIssuesFound: doc.totalIssuesFound,
    categoriesAnalyzed: doc.categoriesAnalyzed,
    appliedCorrections: doc.appliedCorrections.map(deserializeAppliedCorrection),
    ignoredIssueIds: doc.ignoredIssueIds,
    createdAt: new Date(doc.createdAt),
  });
}
