// ABOUTME: Immutable value object representing a single analysis issue
// ABOUTME: Handles position validation, status transitions, and helper methods

import { AnalysisCategory } from './AnalysisCategory';
import { AnalysisSeverity } from './AnalysisSeverity';

export const ANALYSIS_ISSUE_STATUSES = ['pending', 'applied', 'ignored'] as const;

export type AnalysisIssueStatus = (typeof ANALYSIS_ISSUE_STATUSES)[number];

export function isValidAnalysisIssueStatus(value: string): value is AnalysisIssueStatus {
  return ANALYSIS_ISSUE_STATUSES.includes(value as AnalysisIssueStatus);
}

export interface AnalysisIssuePosition {
  start: number;
  end: number;
}

export interface AnalysisIssueData {
  id?: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  originalText: string;
  suggestion: string;
  explanation: string;
  position: AnalysisIssuePosition;
  context: string;
}

export class AnalysisIssue {
  readonly id: string;
  readonly category: AnalysisCategory;
  readonly severity: AnalysisSeverity;
  readonly originalText: string;
  readonly suggestion: string;
  readonly explanation: string;
  readonly position: AnalysisIssuePosition;
  readonly context: string;
  readonly status: AnalysisIssueStatus;

  constructor(
    data: AnalysisIssueData,
    status: AnalysisIssueStatus = 'pending'
  ) {
    // Validate position
    if (data.position.start < 0) {
      throw new Error('Position start must be non-negative');
    }
    if (data.position.end < data.position.start) {
      throw new Error('Position end must be greater than or equal to start');
    }

    // Validate originalText
    if (!data.originalText || data.originalText.length === 0) {
      throw new Error('Original text cannot be empty');
    }

    // Validate suggestion (must differ from original, except for style issues)
    if (data.category !== 'style' && data.suggestion === data.originalText) {
      throw new Error('Suggestion must be different from original text');
    }

    this.id = data.id || generateId();
    this.category = data.category;
    this.severity = data.severity;
    this.originalText = data.originalText;
    this.suggestion = data.suggestion;
    this.explanation = data.explanation;
    this.position = { ...data.position };
    this.context = data.context;
    this.status = status;
  }

  apply(): AnalysisIssue {
    if (this.status === 'applied') {
      throw new Error('Cannot apply an already applied issue');
    }
    if (this.status === 'ignored') {
      throw new Error('Cannot apply an ignored issue');
    }

    return new AnalysisIssue(this.toData(), 'applied');
  }

  ignore(): AnalysisIssue {
    if (this.status === 'ignored') {
      throw new Error('Cannot ignore an already ignored issue');
    }
    if (this.status === 'applied') {
      throw new Error('Cannot ignore an applied issue');
    }

    return new AnalysisIssue(this.toData(), 'ignored');
  }

  getTextLength(): number {
    return this.position.end - this.position.start;
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isResolved(): boolean {
    return this.status === 'applied' || this.status === 'ignored';
  }

  withAdjustedPosition(delta: number): AnalysisIssue {
    const data = this.toData();
    data.position = {
      start: data.position.start + delta,
      end: data.position.end + delta,
    };
    return new AnalysisIssue(data, this.status);
  }

  private toData(): AnalysisIssueData {
    return {
      id: this.id,
      category: this.category,
      severity: this.severity,
      originalText: this.originalText,
      suggestion: this.suggestion,
      explanation: this.explanation,
      position: { ...this.position },
      context: this.context,
    };
  }
}

export function createAnalysisIssue(data: AnalysisIssueData): AnalysisIssue {
  return new AnalysisIssue(data);
}

function generateId(): string {
  return `issue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
