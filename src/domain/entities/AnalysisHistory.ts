// ABOUTME: Domain entity representing a historical record of chapter analysis
// ABOUTME: Tracks applied corrections, ignored issues, and enables before/after comparison

import { AnalysisCategory } from '../value-objects/AnalysisCategory';

export interface AppliedCorrection {
  issueId: string;
  originalText: string;
  appliedText: string;
  appliedAt: Date;
}

export interface AnalysisHistoryData {
  id: string;
  chapterId: string;
  projectId: string;
  ownerId: string;
  originalContent: string;
  totalIssuesFound: number;
  categoriesAnalyzed: AnalysisCategory[];
  appliedCorrections?: AppliedCorrection[];
  ignoredIssueIds?: string[];
  createdAt?: Date;
}

export class AnalysisHistory {
  private readonly id: string;
  private readonly chapterId: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly originalContent: string;
  private readonly totalIssuesFound: number;
  private readonly categoriesAnalyzed: AnalysisCategory[];
  private readonly appliedCorrections: AppliedCorrection[];
  private readonly ignoredIssueIds: string[];
  private readonly createdAt: Date;

  constructor(data: AnalysisHistoryData) {
    // Validate id
    if (!data.id || data.id.trim().length === 0) {
      throw new Error('History ID cannot be empty');
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

    // Validate originalContent
    if (!data.originalContent || data.originalContent.length === 0) {
      throw new Error('Original content cannot be empty');
    }

    this.id = data.id.trim();
    this.chapterId = data.chapterId.trim();
    this.projectId = data.projectId.trim();
    this.ownerId = data.ownerId.trim();
    this.originalContent = data.originalContent;
    this.totalIssuesFound = data.totalIssuesFound;
    this.categoriesAnalyzed = [...data.categoriesAnalyzed];
    this.appliedCorrections = data.appliedCorrections
      ? data.appliedCorrections.map((c) => ({ ...c }))
      : [];
    this.ignoredIssueIds = data.ignoredIssueIds ? [...data.ignoredIssueIds] : [];
    this.createdAt = data.createdAt ?? new Date();
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

  getOriginalContent(): string {
    return this.originalContent;
  }

  getTotalIssuesFound(): number {
    return this.totalIssuesFound;
  }

  getCategoriesAnalyzed(): AnalysisCategory[] {
    return [...this.categoriesAnalyzed];
  }

  getAppliedCorrections(): AppliedCorrection[] {
    return this.appliedCorrections.map((c) => ({ ...c }));
  }

  getIgnoredIssueIds(): string[] {
    return [...this.ignoredIssueIds];
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  // Correction management (immutable)
  addAppliedCorrection(correction: AppliedCorrection): AnalysisHistory {
    // Don't add if already exists
    if (this.appliedCorrections.some((c) => c.issueId === correction.issueId)) {
      return this;
    }

    return new AnalysisHistory({
      ...this.toData(),
      appliedCorrections: [...this.appliedCorrections, { ...correction }],
    });
  }

  addIgnoredIssue(issueId: string): AnalysisHistory {
    // Don't add if already exists
    if (this.ignoredIssueIds.includes(issueId)) {
      return this;
    }

    return new AnalysisHistory({
      ...this.toData(),
      ignoredIssueIds: [...this.ignoredIssueIds, issueId],
    });
  }

  // Statistics
  getAppliedCount(): number {
    return this.appliedCorrections.length;
  }

  getIgnoredCount(): number {
    return this.ignoredIssueIds.length;
  }

  getResolvedCount(): number {
    return this.getAppliedCount() + this.getIgnoredCount();
  }

  getPendingCount(): number {
    return this.totalIssuesFound - this.getResolvedCount();
  }

  // Content comparison
  getCurrentContent(): string {
    if (this.appliedCorrections.length === 0) {
      return this.originalContent;
    }

    // Apply corrections in order
    // Note: This is a simple text replacement approach
    // A more robust implementation would use position-based replacement
    let content = this.originalContent;
    for (const correction of this.appliedCorrections) {
      content = content.replace(correction.originalText, correction.appliedText);
    }

    return content;
  }

  hasCorrections(): boolean {
    return this.appliedCorrections.length > 0;
  }

  private toData(): AnalysisHistoryData {
    return {
      id: this.id,
      chapterId: this.chapterId,
      projectId: this.projectId,
      ownerId: this.ownerId,
      originalContent: this.originalContent,
      totalIssuesFound: this.totalIssuesFound,
      categoriesAnalyzed: [...this.categoriesAnalyzed],
      appliedCorrections: this.appliedCorrections.map((c) => ({ ...c })),
      ignoredIssueIds: [...this.ignoredIssueIds],
      createdAt: new Date(this.createdAt.getTime()),
    };
  }
}
