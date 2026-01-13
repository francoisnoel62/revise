// ABOUTME: Unit tests for CorrectionHistory entity
// ABOUTME: Validates creation, getters, and immutability constraints

import { describe, it, expect } from 'vitest';
import { CorrectionHistory } from './CorrectionHistory';

describe('CorrectionHistory', () => {
  const validData = {
    id: 'history-1',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    selectedText: 'The quick brown fox',
    proposals: [
      'The swift brown fox',
      'The agile brown fox',
      'The rapid brown fox',
    ],
    createdAt: new Date('2026-01-12T10:00:00Z'),
  };

  describe('constructor', () => {
    it('should create a valid CorrectionHistory', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals,
        validData.createdAt
      );

      expect(history.getId()).toBe(validData.id);
      expect(history.getProjectId()).toBe(validData.projectId);
      expect(history.getChapterId()).toBe(validData.chapterId);
      expect(history.getSelectedText()).toBe(validData.selectedText);
      expect(history.getProposals()).toEqual(validData.proposals);
      expect(history.getCreatedAt()).toEqual(validData.createdAt);
    });

    it('should use current date if createdAt is not provided', () => {
      const before = new Date();
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals
      );
      const after = new Date();

      expect(history.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error if id is empty', () => {
      expect(() => new CorrectionHistory(
        '',
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals
      )).toThrow('CorrectionHistory ID cannot be empty');
    });

    it('should throw error if id is whitespace only', () => {
      expect(() => new CorrectionHistory(
        '   ',
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals
      )).toThrow('CorrectionHistory ID cannot be empty');
    });

    it('should throw error if projectId is empty', () => {
      expect(() => new CorrectionHistory(
        validData.id,
        '',
        validData.chapterId,
        validData.selectedText,
        validData.proposals
      )).toThrow('Project ID cannot be empty');
    });

    it('should throw error if chapterId is empty', () => {
      expect(() => new CorrectionHistory(
        validData.id,
        validData.projectId,
        '',
        validData.selectedText,
        validData.proposals
      )).toThrow('Chapter ID cannot be empty');
    });

    it('should throw error if selectedText is empty', () => {
      expect(() => new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        '',
        validData.proposals
      )).toThrow('Selected text cannot be empty');
    });

    it('should throw error if proposals array is empty', () => {
      expect(() => new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        []
      )).toThrow('At least one proposal is required');
    });

    it('should throw error if any proposal is empty', () => {
      expect(() => new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        ['Valid proposal', '', 'Another valid']
      )).toThrow('Proposal content cannot be empty');
    });
  });

  describe('getters', () => {
    it('should return a copy of proposals array (immutability)', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals,
        validData.createdAt
      );

      const proposals = history.getProposals();
      proposals.push('New proposal');

      expect(history.getProposals()).toHaveLength(3);
      expect(history.getProposals()).not.toContain('New proposal');
    });

    it('should return a copy of createdAt date (immutability)', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals,
        validData.createdAt
      );

      const date = history.getCreatedAt();
      date.setFullYear(2000);

      expect(history.getCreatedAt().getFullYear()).toBe(2026);
    });
  });

  describe('getProposalCount', () => {
    it('should return the number of proposals', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        validData.proposals,
        validData.createdAt
      );

      expect(history.getProposalCount()).toBe(3);
    });

    it('should return 1 for single proposal', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        ['Single proposal'],
        validData.createdAt
      );

      expect(history.getProposalCount()).toBe(1);
    });
  });

  describe('trimming behavior', () => {
    it('should trim selectedText', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        '  The quick brown fox  ',
        validData.proposals,
        validData.createdAt
      );

      expect(history.getSelectedText()).toBe('The quick brown fox');
    });

    it('should trim proposals', () => {
      const history = new CorrectionHistory(
        validData.id,
        validData.projectId,
        validData.chapterId,
        validData.selectedText,
        ['  Proposal 1  ', '  Proposal 2  ', '  Proposal 3  '],
        validData.createdAt
      );

      expect(history.getProposals()).toEqual([
        'Proposal 1',
        'Proposal 2',
        'Proposal 3',
      ]);
    });
  });
});
