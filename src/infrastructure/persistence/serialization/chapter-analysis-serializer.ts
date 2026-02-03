// ABOUTME: Serialization utilities for ChapterAnalysis <-> MongoDB document conversion.
// ABOUTME: Handles complex nested structures like issues and repetitions.

import { ChapterAnalysis } from '@/domain/entities/ChapterAnalysis';
import { AnalysisIssue, createAnalysisIssue, AnalysisIssueStatus } from '@/domain/value-objects/AnalysisIssue';
import { RepetitionCluster, createRepetitionCluster } from '@/domain/value-objects/RepetitionCluster';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { AnalysisSeverity } from '@/domain/value-objects/AnalysisSeverity';
import { StyleRigor } from '@/domain/value-objects/StyleRigor';

/**
 * MongoDB document shape for AnalysisIssue.
 */
export interface AnalysisIssueDocument {
  id: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  originalText: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  context: string;
  status: AnalysisIssueStatus;
}

/**
 * MongoDB document shape for RepetitionCluster.
 */
export interface RepetitionClusterDocument {
  word: string;
  positions: Array<{ start: number; end: number }>;
  suggestions: string[];
  isIntentional: boolean;
}

/**
 * MongoDB document shape for ChapterAnalysis.
 */
export interface ChapterAnalysisDocument {
  _id: string;
  chapterId: string;
  projectId: string;
  ownerId: string;
  categories: AnalysisCategory[];
  styleRigor: StyleRigor;
  issues: AnalysisIssueDocument[];
  repetitions: RepetitionClusterDocument[];
  contentHash: string;
  analyzedAt: Date;
}

/**
 * Convert AnalysisIssue to document format.
 */
function serializeIssue(issue: AnalysisIssue): AnalysisIssueDocument {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    originalText: issue.originalText,
    suggestion: issue.suggestion,
    explanation: issue.explanation,
    position: { ...issue.position },
    context: issue.context,
    status: issue.status,
  };
}

/**
 * Reconstruct AnalysisIssue from document.
 */
function deserializeIssue(doc: AnalysisIssueDocument): AnalysisIssue {
  const issue = createAnalysisIssue({
    id: doc.id,
    category: doc.category,
    severity: doc.severity,
    originalText: doc.originalText,
    suggestion: doc.suggestion,
    explanation: doc.explanation,
    position: doc.position,
    context: doc.context,
  });

  // Apply status if not pending
  if (doc.status === 'applied') {
    return issue.apply();
  }
  if (doc.status === 'ignored') {
    return issue.ignore();
  }

  return issue;
}

/**
 * Convert RepetitionCluster to document format.
 */
function serializeRepetition(cluster: RepetitionCluster): RepetitionClusterDocument {
  return {
    word: cluster.word,
    positions: cluster.positions.map((p) => ({ ...p })),
    suggestions: [...cluster.suggestions],
    isIntentional: cluster.isIntentional,
  };
}

/**
 * Reconstruct RepetitionCluster from document.
 */
function deserializeRepetition(doc: RepetitionClusterDocument): RepetitionCluster {
  return createRepetitionCluster({
    word: doc.word,
    positions: doc.positions,
    suggestions: doc.suggestions,
    isIntentional: doc.isIntentional,
  });
}

/**
 * Convert ChapterAnalysis domain entity to MongoDB document.
 */
export function serializeChapterAnalysis(
  analysis: ChapterAnalysis,
  ownerId: string
): ChapterAnalysisDocument {
  return {
    _id: analysis.getId(),
    chapterId: analysis.getChapterId(),
    projectId: analysis.getProjectId(),
    ownerId,
    categories: analysis.getCategories(),
    styleRigor: analysis.getStyleRigor(),
    issues: analysis.getIssues().map(serializeIssue),
    repetitions: analysis.getRepetitions().map(serializeRepetition),
    contentHash: analysis.getContentHash(),
    analyzedAt: analysis.getAnalyzedAt(),
  };
}

/**
 * Reconstruct ChapterAnalysis domain entity from MongoDB document.
 */
export function deserializeChapterAnalysis(doc: ChapterAnalysisDocument): ChapterAnalysis {
  return new ChapterAnalysis({
    id: doc._id,
    chapterId: doc.chapterId,
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    categories: doc.categories,
    styleRigor: doc.styleRigor,
    issues: doc.issues.map(deserializeIssue),
    repetitions: doc.repetitions.map(deserializeRepetition),
    contentHash: doc.contentHash,
    analyzedAt: new Date(doc.analyzedAt),
  });
}
