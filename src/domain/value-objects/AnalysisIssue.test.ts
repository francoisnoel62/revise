// ABOUTME: Test suite for AnalysisIssue value object
// ABOUTME: Validates issue creation, position validation, and status transitions

import { describe, it, expect } from 'vitest';
import {
  AnalysisIssue,
  createAnalysisIssue,
  AnalysisIssueStatus,
  ANALYSIS_ISSUE_STATUSES,
  isValidAnalysisIssueStatus,
} from './AnalysisIssue';

describe('AnalysisIssue', () => {
  const validIssueData = {
    id: 'issue-1',
    category: 'spelling' as const,
    severity: 'error' as const,
    originalText: 'Elle à dit',
    suggestion: 'Elle a dit',
    explanation: 'Confusion à/a : "a" sans accent est le verbe avoir',
    position: { start: 10, end: 20 },
    context: 'Hier, Elle à dit quelque chose.',
  };

  describe('ANALYSIS_ISSUE_STATUSES', () => {
    it('should contain all three statuses', () => {
      expect(ANALYSIS_ISSUE_STATUSES).toContain('pending');
      expect(ANALYSIS_ISSUE_STATUSES).toContain('applied');
      expect(ANALYSIS_ISSUE_STATUSES).toContain('ignored');
      expect(ANALYSIS_ISSUE_STATUSES).toHaveLength(3);
    });
  });

  describe('isValidAnalysisIssueStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isValidAnalysisIssueStatus('pending')).toBe(true);
      expect(isValidAnalysisIssueStatus('applied')).toBe(true);
      expect(isValidAnalysisIssueStatus('ignored')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(isValidAnalysisIssueStatus('invalid')).toBe(false);
      expect(isValidAnalysisIssueStatus('')).toBe(false);
    });
  });

  describe('createAnalysisIssue', () => {
    it('should create a valid issue with pending status', () => {
      const issue = createAnalysisIssue(validIssueData);

      expect(issue.id).toBe('issue-1');
      expect(issue.category).toBe('spelling');
      expect(issue.severity).toBe('error');
      expect(issue.originalText).toBe('Elle à dit');
      expect(issue.suggestion).toBe('Elle a dit');
      expect(issue.explanation).toContain('Confusion');
      expect(issue.position.start).toBe(10);
      expect(issue.position.end).toBe(20);
      expect(issue.context).toContain('Hier');
      expect(issue.status).toBe('pending');
    });

    it('should throw error if position start is negative', () => {
      expect(() => {
        createAnalysisIssue({
          ...validIssueData,
          position: { start: -1, end: 10 },
        });
      }).toThrow('Position start must be non-negative');
    });

    it('should throw error if position end is before start', () => {
      expect(() => {
        createAnalysisIssue({
          ...validIssueData,
          position: { start: 20, end: 10 },
        });
      }).toThrow('Position end must be greater than or equal to start');
    });

    it('should throw error if originalText is empty', () => {
      expect(() => {
        createAnalysisIssue({
          ...validIssueData,
          originalText: '',
        });
      }).toThrow('Original text cannot be empty');
    });

    it('should throw error if suggestion is same as originalText', () => {
      expect(() => {
        createAnalysisIssue({
          ...validIssueData,
          suggestion: 'Elle à dit',
        });
      }).toThrow('Suggestion must be different from original text');
    });

    it('should allow empty suggestion for style issues', () => {
      const issue = createAnalysisIssue({
        ...validIssueData,
        category: 'style',
        suggestion: '',
      });

      expect(issue.suggestion).toBe('');
    });

    it('should generate id if not provided', () => {
      const { id, ...dataWithoutId } = validIssueData;
      const issue = createAnalysisIssue(dataWithoutId);

      expect(issue.id).toBeDefined();
      expect(typeof issue.id).toBe('string');
      expect(issue.id.length).toBeGreaterThan(0);
    });
  });

  describe('AnalysisIssue status transitions', () => {
    it('should allow transition from pending to applied', () => {
      const issue = createAnalysisIssue(validIssueData);
      const appliedIssue = issue.apply();

      expect(appliedIssue.status).toBe('applied');
      // Original should be unchanged (immutable)
      expect(issue.status).toBe('pending');
    });

    it('should allow transition from pending to ignored', () => {
      const issue = createAnalysisIssue(validIssueData);
      const ignoredIssue = issue.ignore();

      expect(ignoredIssue.status).toBe('ignored');
      expect(issue.status).toBe('pending');
    });

    it('should throw error when applying already applied issue', () => {
      const issue = createAnalysisIssue(validIssueData);
      const appliedIssue = issue.apply();

      expect(() => appliedIssue.apply()).toThrow('Cannot apply an already applied issue');
    });

    it('should throw error when ignoring already ignored issue', () => {
      const issue = createAnalysisIssue(validIssueData);
      const ignoredIssue = issue.ignore();

      expect(() => ignoredIssue.ignore()).toThrow('Cannot ignore an already ignored issue');
    });

    it('should throw error when applying ignored issue', () => {
      const issue = createAnalysisIssue(validIssueData);
      const ignoredIssue = issue.ignore();

      expect(() => ignoredIssue.apply()).toThrow('Cannot apply an ignored issue');
    });

    it('should throw error when ignoring applied issue', () => {
      const issue = createAnalysisIssue(validIssueData);
      const appliedIssue = issue.apply();

      expect(() => appliedIssue.ignore()).toThrow('Cannot ignore an applied issue');
    });
  });

  describe('AnalysisIssue helper methods', () => {
    it('should return correct text length', () => {
      const issue = createAnalysisIssue(validIssueData);

      expect(issue.getTextLength()).toBe(10); // end - start = 20 - 10
    });

    it('should check if issue is pending', () => {
      const issue = createAnalysisIssue(validIssueData);

      expect(issue.isPending()).toBe(true);
      expect(issue.apply().isPending()).toBe(false);
      expect(issue.ignore().isPending()).toBe(false);
    });

    it('should check if issue is resolved (applied or ignored)', () => {
      const issue = createAnalysisIssue(validIssueData);

      expect(issue.isResolved()).toBe(false);
      expect(issue.apply().isResolved()).toBe(true);
      expect(issue.ignore().isResolved()).toBe(true);
    });
  });

  describe('AnalysisIssue immutability', () => {
    it('should return new instance on status change', () => {
      const issue = createAnalysisIssue(validIssueData);
      const appliedIssue = issue.apply();

      expect(appliedIssue).not.toBe(issue);
      expect(appliedIssue.id).toBe(issue.id);
    });
  });
});
