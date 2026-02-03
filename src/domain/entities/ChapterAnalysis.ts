// ABOUTME: Domain entity representing a complete chapter analysis result
// ABOUTME: Manages issues, repetitions, statistics, and filtering with immutability

import { AnalysisCategory, ANALYSIS_CATEGORIES } from '../value-objects/AnalysisCategory';
import { AnalysisSeverity, ANALYSIS_SEVERITIES } from '../value-objects/AnalysisSeverity';
import { StyleRigor } from '../value-objects/StyleRigor';
import { AnalysisIssue } from '../value-objects/AnalysisIssue';
import { RepetitionCluster } from '../value-objects/RepetitionCluster';

export interface ChapterAnalysisData {
  id: string;
  chapterId: string;
  projectId: string;
  ownerId: string;
  categories: AnalysisCategory[];
  styleRigor: StyleRigor;
  issues: AnalysisIssue[];
  repetitions: RepetitionCluster[];
  contentHash: string;
  analyzedAt?: Date;
}

export class ChapterAnalysis {
  private readonly id: string;
  private readonly chapterId: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly categories: AnalysisCategory[];
  private readonly styleRigor: StyleRigor;
  private readonly issues: AnalysisIssue[];
  private readonly repetitions: RepetitionCluster[];
  private readonly contentHash: string;
  private readonly analyzedAt: Date;

  constructor(data: ChapterAnalysisData) {
    // Validate id
    if (!data.id || data.id.trim().length === 0) {
      throw new Error('Analysis ID cannot be empty');
    }

    // Validate chapterId
    if (!data.chapterId || data.chapterId.trim().length === 0) {
      throw new Error('Chapter ID cannot be empty');
    }

    // Validate projectId
    if (!data.projectId || data.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate ownerId
    if (!data.ownerId || data.ownerId.trim().length === 0) {
      throw new Error('Owner ID cannot be empty');
    }

    // Validate categories
    if (!data.categories || data.categories.length === 0) {
      throw new Error('At least one category must be specified');
    }

    // Validate contentHash
    if (!data.contentHash || data.contentHash.trim().length === 0) {
      throw new Error('Content hash cannot be empty');
    }

    this.id = data.id.trim();
    this.chapterId = data.chapterId.trim();
    this.projectId = data.projectId.trim();
    this.ownerId = data.ownerId.trim();
    this.categories = [...data.categories];
    this.styleRigor = data.styleRigor;
    this.issues = [...data.issues];
    this.repetitions = [...data.repetitions];
    this.contentHash = data.contentHash.trim();
    this.analyzedAt = data.analyzedAt ?? new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getChapterId(): string {
    return this.chapterId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getCategories(): AnalysisCategory[] {
    return [...this.categories];
  }

  getStyleRigor(): StyleRigor {
    return this.styleRigor;
  }

  getContentHash(): string {
    return this.contentHash;
  }

  getAnalyzedAt(): Date {
    return new Date(this.analyzedAt.getTime());
  }

  getIssues(): AnalysisIssue[] {
    return [...this.issues];
  }

  getIssue(id: string): AnalysisIssue | undefined {
    return this.issues.find((issue) => issue.id === id);
  }

  getRepetitions(): RepetitionCluster[] {
    return [...this.repetitions];
  }

  // Issue management (immutable)
  addIssue(issue: AnalysisIssue): ChapterAnalysis {
    return new ChapterAnalysis({
      ...this.toData(),
      issues: [...this.issues, issue],
    });
  }

  applyIssue(issueId: string): ChapterAnalysis {
    const issueIndex = this.issues.findIndex((i) => i.id === issueId);
    if (issueIndex === -1) {
      throw new Error('Issue not found');
    }

    const updatedIssues = [...this.issues];
    updatedIssues[issueIndex] = updatedIssues[issueIndex].apply();

    return new ChapterAnalysis({
      ...this.toData(),
      issues: updatedIssues,
    });
  }

  ignoreIssue(issueId: string): ChapterAnalysis {
    const issueIndex = this.issues.findIndex((i) => i.id === issueId);
    if (issueIndex === -1) {
      throw new Error('Issue not found');
    }

    const updatedIssues = [...this.issues];
    updatedIssues[issueIndex] = updatedIssues[issueIndex].ignore();

    return new ChapterAnalysis({
      ...this.toData(),
      issues: updatedIssues,
    });
  }

  // Filtering
  getIssuesByCategory(category: AnalysisCategory): AnalysisIssue[] {
    return this.issues.filter((issue) => issue.category === category);
  }

  getIssuesBySeverity(severity: AnalysisSeverity): AnalysisIssue[] {
    return this.issues.filter((issue) => issue.severity === severity);
  }

  getPendingIssues(): AnalysisIssue[] {
    return this.issues.filter((issue) => issue.isPending());
  }

  getNonIntentionalRepetitions(): RepetitionCluster[] {
    return this.repetitions.filter((r) => !r.isIntentional);
  }

  // Statistics
  getTotalIssueCount(): number {
    return this.issues.length;
  }

  getStatsByCategory(): Record<AnalysisCategory, number> {
    const stats: Record<string, number> = {};

    for (const category of ANALYSIS_CATEGORIES) {
      stats[category] = this.issues.filter((i) => i.category === category).length;
    }

    return stats as Record<AnalysisCategory, number>;
  }

  getStatsBySeverity(): Record<AnalysisSeverity, number> {
    const stats: Record<string, number> = {};

    for (const severity of ANALYSIS_SEVERITIES) {
      stats[severity] = this.issues.filter((i) => i.severity === severity).length;
    }

    return stats as Record<AnalysisSeverity, number>;
  }

  getPendingCount(): number {
    return this.issues.filter((i) => i.status === 'pending').length;
  }

  getAppliedCount(): number {
    return this.issues.filter((i) => i.status === 'applied').length;
  }

  getIgnoredCount(): number {
    return this.issues.filter((i) => i.status === 'ignored').length;
  }

  // Cache check
  hasChanges(currentHash: string): boolean {
    return this.contentHash !== currentHash;
  }

  private toData(): ChapterAnalysisData {
    return {
      id: this.id,
      chapterId: this.chapterId,
      projectId: this.projectId,
      ownerId: this.ownerId,
      categories: [...this.categories],
      styleRigor: this.styleRigor,
      issues: [...this.issues],
      repetitions: [...this.repetitions],
      contentHash: this.contentHash,
      analyzedAt: new Date(this.analyzedAt.getTime()),
    };
  }
}
