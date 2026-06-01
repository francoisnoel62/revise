// ABOUTME: Tests for WritingQuota entity
// ABOUTME: Covers creation, validation, progress (floored at 0), and mutations

import { describe, it, expect } from 'vitest';
import { WritingQuota } from '../WritingQuota';

describe('WritingQuota', () => {
  describe('create', () => {
    it('creates a daily quota with valid parameters', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);

      expect(quota.getId()).toBe('q-1');
      expect(quota.getProjectId()).toBe('project-1');
      expect(quota.getOwnerId()).toBe('user-1');
      expect(quota.getPeriod()).toBe('daily');
      expect(quota.getTargetWords()).toBe(1000);
    });

    it('creates a weekly quota', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'weekly', 5000);
      expect(quota.getPeriod()).toBe('weekly');
    });

    it('throws for zero or negative target words', () => {
      expect(() =>
        WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 0)
      ).toThrow('Target words must be greater than 0');
      expect(() =>
        WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', -5)
      ).toThrow('Target words must be greater than 0');
    });

    it('throws for non-integer target words', () => {
      expect(() =>
        WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 500.5)
      ).toThrow('Target words must be an integer');
    });
  });

  describe('getProgress', () => {
    it('returns the percentage of the period target reached', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      expect(quota.getProgress(250)).toBe(25);
    });

    it('caps progress at 100 percent', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      expect(quota.getProgress(1500)).toBe(100);
    });

    it('floors progress at 0 for a revision (negative net) period', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      expect(quota.getProgress(-300)).toBe(0);
    });
  });

  describe('isMet', () => {
    it('is met when the words written reach the target', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      expect(quota.isMet(1000)).toBe(true);
      expect(quota.isMet(999)).toBe(false);
    });
  });

  describe('mutations', () => {
    it('updateTarget returns a new quota with a fresh updatedAt', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      const updated = quota.updateTarget(1200);

      expect(updated).not.toBe(quota);
      expect(updated.getTargetWords()).toBe(1200);
      expect(quota.getTargetWords()).toBe(1000);
    });

    it('updateTarget validates the new value', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      expect(() => quota.updateTarget(0)).toThrow('Target words must be greater than 0');
    });

    it('updatePeriod returns a new quota with the new period', () => {
      const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
      const updated = quota.updatePeriod('weekly');
      expect(updated.getPeriod()).toBe('weekly');
    });
  });
});
