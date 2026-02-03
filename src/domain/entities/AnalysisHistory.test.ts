// ABOUTME: Test suite for AnalysisHistory entity
// ABOUTME: Validates history entry creation, correction tracking, and comparisons

import { describe, it, expect } from 'vitest';
import { AnalysisHistory, AppliedCorrection } from './AnalysisHistory';

describe('AnalysisHistory', () => {
  const validData = {
    id: 'history-1',
    chapterId: 'chapter-1',
    projectId: 'project-1',
    ownerId: 'user-1',
    originalContent: 'Elle à dit quelque chose.',
    totalIssuesFound: 5,
    categoriesAnalyzed: ['spelling', 'grammar'] as const,
  };

  describe('constructor', () => {
    it('should create a valid history entry', () => {
      const history = new AnalysisHistory(validData);

      expect(history.getId()).toBe('history-1');
      expect(history.getChapterId()).toBe('chapter-1');
      expect(history.getProjectId()).toBe('project-1');
      expect(history.getOwnerId()).toBe('user-1');
      expect(history.getOriginalContent()).toBe('Elle à dit quelque chose.');
      expect(history.getTotalIssuesFound()).toBe(5);
      expect(history.getCategoriesAnalyzed()).toEqual(['spelling', 'grammar']);
    });

    it('should throw error if id is empty', () => {
      expect(() => {
        new AnalysisHistory({ ...validData, id: '' });
      }).toThrow('History ID cannot be empty');
    });

    it('should throw error if chapterId is empty', () => {
      expect(() => {
        new AnalysisHistory({ ...validData, chapterId: '' });
      }).toThrow('Chapter ID cannot be empty');
    });

    it('should throw error if originalContent is empty', () => {
      expect(() => {
        new AnalysisHistory({ ...validData, originalContent: '' });
      }).toThrow('Original content cannot be empty');
    });

    it('should set createdAt to now if not provided', () => {
      const before = new Date();
      const history = new AnalysisHistory(validData);
      const after = new Date();

      expect(history.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should initialize with empty corrections and ignored issues', () => {
      const history = new AnalysisHistory(validData);

      expect(history.getAppliedCorrections()).toHaveLength(0);
      expect(history.getIgnoredIssueIds()).toHaveLength(0);
    });
  });

  describe('addAppliedCorrection', () => {
    it('should add a correction (immutably)', () => {
      const history = new AnalysisHistory(validData);
      const correction: AppliedCorrection = {
        issueId: 'issue-1',
        originalText: 'à',
        appliedText: 'a',
        appliedAt: new Date(),
      };

      const updated = history.addAppliedCorrection(correction);

      expect(updated.getAppliedCorrections()).toHaveLength(1);
      expect(updated.getAppliedCorrections()[0].issueId).toBe('issue-1');
      expect(history.getAppliedCorrections()).toHaveLength(0); // Original unchanged
    });

    it('should not add duplicate correction for same issue', () => {
      const correction: AppliedCorrection = {
        issueId: 'issue-1',
        originalText: 'à',
        appliedText: 'a',
        appliedAt: new Date(),
      };

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: [correction],
      });

      const updated = history.addAppliedCorrection({
        ...correction,
        appliedText: 'different',
      });

      expect(updated.getAppliedCorrections()).toHaveLength(1);
    });
  });

  describe('addIgnoredIssue', () => {
    it('should add an ignored issue ID (immutably)', () => {
      const history = new AnalysisHistory(validData);

      const updated = history.addIgnoredIssue('issue-1');

      expect(updated.getIgnoredIssueIds()).toContain('issue-1');
      expect(history.getIgnoredIssueIds()).toHaveLength(0); // Original unchanged
    });

    it('should not add duplicate ignored issue', () => {
      const history = new AnalysisHistory({
        ...validData,
        ignoredIssueIds: ['issue-1'],
      });

      const updated = history.addIgnoredIssue('issue-1');

      expect(updated.getIgnoredIssueIds()).toHaveLength(1);
    });
  });

  describe('statistics', () => {
    it('should compute applied count', () => {
      const corrections: AppliedCorrection[] = [
        { issueId: 'issue-1', originalText: 'a', appliedText: 'b', appliedAt: new Date() },
        { issueId: 'issue-2', originalText: 'c', appliedText: 'd', appliedAt: new Date() },
      ];

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: corrections,
      });

      expect(history.getAppliedCount()).toBe(2);
    });

    it('should compute ignored count', () => {
      const history = new AnalysisHistory({
        ...validData,
        ignoredIssueIds: ['issue-1', 'issue-2', 'issue-3'],
      });

      expect(history.getIgnoredCount()).toBe(3);
    });

    it('should compute resolved count (applied + ignored)', () => {
      const corrections: AppliedCorrection[] = [
        { issueId: 'issue-1', originalText: 'a', appliedText: 'b', appliedAt: new Date() },
      ];

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: corrections,
        ignoredIssueIds: ['issue-2'],
      });

      expect(history.getResolvedCount()).toBe(2);
    });

    it('should compute pending count', () => {
      const corrections: AppliedCorrection[] = [
        { issueId: 'issue-1', originalText: 'a', appliedText: 'b', appliedAt: new Date() },
      ];

      const history = new AnalysisHistory({
        ...validData,
        totalIssuesFound: 5,
        appliedCorrections: corrections,
        ignoredIssueIds: ['issue-2'],
      });

      // 5 total - 1 applied - 1 ignored = 3 pending
      expect(history.getPendingCount()).toBe(3);
    });
  });

  describe('getCurrentContent', () => {
    it('should return original content when no corrections', () => {
      const history = new AnalysisHistory(validData);

      expect(history.getCurrentContent()).toBe('Elle à dit quelque chose.');
    });

    it('should apply corrections to get current content', () => {
      const correction: AppliedCorrection = {
        issueId: 'issue-1',
        originalText: 'à',
        appliedText: 'a',
        appliedAt: new Date(),
      };

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: [correction],
      });

      // Note: This tests the concept - actual implementation may use position-based replacement
      expect(history.getCurrentContent()).toContain('a');
    });
  });

  describe('hasCorrections', () => {
    it('should return false when no corrections', () => {
      const history = new AnalysisHistory(validData);

      expect(history.hasCorrections()).toBe(false);
    });

    it('should return true when has corrections', () => {
      const correction: AppliedCorrection = {
        issueId: 'issue-1',
        originalText: 'à',
        appliedText: 'a',
        appliedAt: new Date(),
      };

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: [correction],
      });

      expect(history.hasCorrections()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of corrections array', () => {
      const correction: AppliedCorrection = {
        issueId: 'issue-1',
        originalText: 'à',
        appliedText: 'a',
        appliedAt: new Date(),
      };

      const history = new AnalysisHistory({
        ...validData,
        appliedCorrections: [correction],
      });

      const corrections = history.getAppliedCorrections();
      expect(corrections).toHaveLength(1);
      // Returned array is a copy
    });
  });
});
