// ABOUTME: Test suite for ChapterAnalysis entity
// ABOUTME: Validates analysis creation, issue management, statistics, and filtering

import { describe, it, expect } from 'vitest';
import { ChapterAnalysis } from './ChapterAnalysis';
import { createAnalysisIssue, AnalysisIssue } from '../value-objects/AnalysisIssue';
import { createRepetitionCluster, RepetitionCluster } from '../value-objects/RepetitionCluster';
import { AnalysisCategory } from '../value-objects/AnalysisCategory';

describe('ChapterAnalysis', () => {
  const createTestIssue = (overrides: Partial<{
    id: string;
    category: AnalysisCategory;
    severity: 'error' | 'warning' | 'suggestion';
  }> = {}): AnalysisIssue => {
    return createAnalysisIssue({
      id: overrides.id || 'issue-1',
      category: overrides.category || 'grammar',
      severity: overrides.severity || 'error',
      originalText: 'test',
      suggestion: 'fixed',
      explanation: 'test explanation',
      position: { start: 0, end: 4 },
      context: 'This is a test context.',
    });
  };

  const createTestCluster = (): RepetitionCluster => {
    return createRepetitionCluster({
      word: 'soudain',
      positions: [
        { start: 0, end: 7 },
        { start: 50, end: 57 },
      ],
      suggestions: ['brusquement'],
    });
  };

  describe('constructor', () => {
    it('should create a valid analysis', () => {
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar', 'grammar'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [],
        contentHash: 'abc123',
      });

      expect(analysis.getId()).toBe('analysis-1');
      expect(analysis.getChapterId()).toBe('chapter-1');
      expect(analysis.getProjectId()).toBe('project-1');
      expect(analysis.getOwnerId()).toBe('user-1');
      expect(analysis.getCategories()).toEqual(['grammar', 'grammar']);
      expect(analysis.getStyleRigor()).toBe('moderate');
      expect(analysis.getContentHash()).toBe('abc123');
    });

    it('should throw error if id is empty', () => {
      expect(() => {
        new ChapterAnalysis({
          id: '',
          chapterId: 'chapter-1',
          projectId: 'project-1',
          ownerId: 'user-1',
          categories: ['grammar'],
          styleRigor: 'moderate',
          issues: [],
          repetitions: [],
          contentHash: 'abc123',
        });
      }).toThrow('Analysis ID cannot be empty');
    });

    it('should throw error if chapterId is empty', () => {
      expect(() => {
        new ChapterAnalysis({
          id: 'analysis-1',
          chapterId: '',
          projectId: 'project-1',
          ownerId: 'user-1',
          categories: ['grammar'],
          styleRigor: 'moderate',
          issues: [],
          repetitions: [],
          contentHash: 'abc123',
        });
      }).toThrow('Chapter ID cannot be empty');
    });

    it('should throw error if categories is empty', () => {
      expect(() => {
        new ChapterAnalysis({
          id: 'analysis-1',
          chapterId: 'chapter-1',
          projectId: 'project-1',
          ownerId: 'user-1',
          categories: [],
          styleRigor: 'moderate',
          issues: [],
          repetitions: [],
          contentHash: 'abc123',
        });
      }).toThrow('At least one category must be specified');
    });

    it('should set analyzedAt to now if not provided', () => {
      const before = new Date();
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [],
        contentHash: 'abc123',
      });
      const after = new Date();

      expect(analysis.getAnalyzedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(analysis.getAnalyzedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('issue management', () => {
    it('should add an issue', () => {
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [],
        contentHash: 'abc123',
      });

      const issue = createTestIssue();
      const updated = analysis.addIssue(issue);

      expect(updated.getIssues()).toHaveLength(1);
      expect(analysis.getIssues()).toHaveLength(0); // Immutable
    });

    it('should mark issue as applied', () => {
      const issue = createTestIssue({ id: 'issue-1' });
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const updated = analysis.applyIssue('issue-1');

      expect(updated.getIssue('issue-1')?.status).toBe('applied');
      expect(analysis.getIssue('issue-1')?.status).toBe('pending'); // Immutable
    });

    it('should mark issue as ignored', () => {
      const issue = createTestIssue({ id: 'issue-1' });
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const updated = analysis.ignoreIssue('issue-1');

      expect(updated.getIssue('issue-1')?.status).toBe('ignored');
    });

    it('should throw error when applying non-existent issue', () => {
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [],
        contentHash: 'abc123',
      });

      expect(() => analysis.applyIssue('non-existent')).toThrow('Issue not found');
    });
  });

  describe('filtering', () => {
    it('should filter issues by category', () => {
      const spellingIssue = createTestIssue({ id: 'issue-1', category: 'grammar' });
      const grammarIssue = createTestIssue({ id: 'issue-2', category: 'style' });

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar', 'grammar'],
        styleRigor: 'moderate',
        issues: [spellingIssue, grammarIssue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const grammarOnly = analysis.getIssuesByCategory('grammar');
      expect(grammarOnly).toHaveLength(1);
      expect(grammarOnly[0].category).toBe('grammar');
    });

    it('should filter issues by severity', () => {
      const errorIssue = createTestIssue({ id: 'issue-1', severity: 'error' });
      const warningIssue = createTestIssue({ id: 'issue-2', severity: 'warning' });

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [errorIssue, warningIssue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const errorsOnly = analysis.getIssuesBySeverity('error');
      expect(errorsOnly).toHaveLength(1);
      expect(errorsOnly[0].severity).toBe('error');
    });

    it('should get pending issues only', () => {
      const pendingIssue = createTestIssue({ id: 'issue-1' });
      const appliedIssue = createTestIssue({ id: 'issue-2' }).apply();

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [pendingIssue, appliedIssue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const pending = analysis.getPendingIssues();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('issue-1');
    });
  });

  describe('statistics', () => {
    it('should compute total count', () => {
      const issue1 = createTestIssue({ id: 'issue-1' });
      const issue2 = createTestIssue({ id: 'issue-2' });

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue1, issue2],
        repetitions: [],
        contentHash: 'abc123',
      });

      expect(analysis.getTotalIssueCount()).toBe(2);
    });

    it('should compute stats by category', () => {
      const grammar1 = createTestIssue({ id: 'issue-1', category: 'grammar' });
      const grammar2 = createTestIssue({ id: 'issue-2', category: 'grammar' });
      const style1 = createTestIssue({ id: 'issue-3', category: 'style' });

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar', 'grammar'],
        styleRigor: 'moderate',
        issues: [grammar1, grammar2, style1],
        repetitions: [],
        contentHash: 'abc123',
      });

      const stats = analysis.getStatsByCategory();
      expect(stats.grammar).toBe(2);
      expect(stats.style).toBe(1);
    });

    it('should compute stats by severity', () => {
      const error1 = createTestIssue({ id: 'issue-1', severity: 'error' });
      const warning1 = createTestIssue({ id: 'issue-2', severity: 'warning' });
      const warning2 = createTestIssue({ id: 'issue-3', severity: 'warning' });

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [error1, warning1, warning2],
        repetitions: [],
        contentHash: 'abc123',
      });

      const stats = analysis.getStatsBySeverity();
      expect(stats.error).toBe(1);
      expect(stats.warning).toBe(2);
      expect(stats.suggestion).toBe(0);
    });

    it('should compute pending count', () => {
      const pending = createTestIssue({ id: 'issue-1' });
      const applied = createTestIssue({ id: 'issue-2' }).apply();
      const ignored = createTestIssue({ id: 'issue-3' }).ignore();

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [pending, applied, ignored],
        repetitions: [],
        contentHash: 'abc123',
      });

      expect(analysis.getPendingCount()).toBe(1);
      expect(analysis.getAppliedCount()).toBe(1);
      expect(analysis.getIgnoredCount()).toBe(1);
    });
  });

  describe('repetitions', () => {
    it('should store repetition clusters', () => {
      const cluster = createTestCluster();

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['repetition'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [cluster],
        contentHash: 'abc123',
      });

      expect(analysis.getRepetitions()).toHaveLength(1);
      expect(analysis.getRepetitions()[0].word).toBe('soudain');
    });

    it('should return non-intentional repetitions', () => {
      const intentional = createRepetitionCluster({
        word: 'Jean',
        positions: [{ start: 0, end: 4 }, { start: 50, end: 54 }],
        isIntentional: true,
      });
      const unintentional = createTestCluster();

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['repetition'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [intentional, unintentional],
        contentHash: 'abc123',
      });

      const nonIntentional = analysis.getNonIntentionalRepetitions();
      expect(nonIntentional).toHaveLength(1);
      expect(nonIntentional[0].word).toBe('soudain');
    });
  });

  describe('hasChanges', () => {
    it('should return true if content hash differs', () => {
      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [],
        repetitions: [],
        contentHash: 'abc123',
      });

      expect(analysis.hasChanges('abc123')).toBe(false);
      expect(analysis.hasChanges('xyz789')).toBe(true);
    });
  });

  describe('adjustPositionsAfterCorrection', () => {
    const createIssueAtPosition = (id: string, start: number, end: number): AnalysisIssue => {
      return createAnalysisIssue({
        id,
        category: 'grammar',
        severity: 'error',
        originalText: 'x'.repeat(end - start),
        suggestion: 'fixed',
        explanation: 'test',
        position: { start, end },
        context: 'context',
      });
    };

    it('should adjust positions of issues after the correction point', () => {
      const issue1 = createIssueAtPosition('issue-1', 10, 15);
      const issue2 = createIssueAtPosition('issue-2', 50, 60);
      const issue3 = createIssueAtPosition('issue-3', 100, 110);

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue1, issue2, issue3],
        repetitions: [],
        contentHash: 'abc123',
      });

      // Correction ended at position 15, delta is -3 (removed 3 chars)
      const adjusted = analysis.adjustPositionsAfterCorrection(15, -3);

      // Issue 1 ends at 15, so it should NOT be adjusted
      expect(adjusted.getIssue('issue-1')?.position).toEqual({ start: 10, end: 15 });

      // Issue 2 starts at 50 (> 15), should be adjusted by -3
      expect(adjusted.getIssue('issue-2')?.position).toEqual({ start: 47, end: 57 });

      // Issue 3 starts at 100 (> 15), should be adjusted by -3
      expect(adjusted.getIssue('issue-3')?.position).toEqual({ start: 97, end: 107 });
    });

    it('should handle positive delta (text got longer)', () => {
      const issue1 = createIssueAtPosition('issue-1', 10, 15);
      const issue2 = createIssueAtPosition('issue-2', 50, 60);

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue1, issue2],
        repetitions: [],
        contentHash: 'abc123',
      });

      // Correction ended at position 15, delta is +5 (added 5 chars)
      const adjusted = analysis.adjustPositionsAfterCorrection(15, 5);

      expect(adjusted.getIssue('issue-1')?.position).toEqual({ start: 10, end: 15 });
      expect(adjusted.getIssue('issue-2')?.position).toEqual({ start: 55, end: 65 });
    });

    it('should not adjust issues before the correction point', () => {
      const issue1 = createIssueAtPosition('issue-1', 10, 15);
      const issue2 = createIssueAtPosition('issue-2', 50, 60);

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue1, issue2],
        repetitions: [],
        contentHash: 'abc123',
      });

      // Correction ended at position 60
      const adjusted = analysis.adjustPositionsAfterCorrection(60, -5);

      // Both issues are before position 60, so neither should be adjusted
      expect(adjusted.getIssue('issue-1')?.position).toEqual({ start: 10, end: 15 });
      expect(adjusted.getIssue('issue-2')?.position).toEqual({ start: 50, end: 60 });
    });

    it('should be immutable', () => {
      const issue = createIssueAtPosition('issue-1', 50, 60);

      const analysis = new ChapterAnalysis({
        id: 'analysis-1',
        chapterId: 'chapter-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        categories: ['grammar'],
        styleRigor: 'moderate',
        issues: [issue],
        repetitions: [],
        contentHash: 'abc123',
      });

      const adjusted = analysis.adjustPositionsAfterCorrection(15, -3);

      // Original should be unchanged
      expect(analysis.getIssue('issue-1')?.position).toEqual({ start: 50, end: 60 });
      expect(adjusted.getIssue('issue-1')?.position).toEqual({ start: 47, end: 57 });
    });
  });
});
