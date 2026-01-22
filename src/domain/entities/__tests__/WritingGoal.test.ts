// ABOUTME: Tests for WritingGoal entity
// ABOUTME: Covers creation, validation, business logic, and mutations

import { describe, it, expect } from 'vitest';
import { WritingGoal } from '../WritingGoal';

describe('WritingGoal', () => {
  describe('create', () => {
    it('creates a goal with valid parameters', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        50000
      );

      expect(goal.getId()).toBe('goal-1');
      expect(goal.getProjectId()).toBe('project-1');
      expect(goal.getOwnerId()).toBe('user-1');
      expect(goal.getType()).toBe('total');
      expect(goal.getTargetWords()).toBe(50000);
      expect(goal.getDeadline()).toBeNull();
    });

    it('creates a goal with deadline', () => {
      const deadline = new Date('2025-12-31');
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'weekly',
        5000,
        deadline
      );

      expect(goal.getDeadline()).toEqual(deadline);
    });

    it('throws error for zero target words', () => {
      expect(() =>
        WritingGoal.create('goal-1', 'project-1', 'user-1', 'daily', 0)
      ).toThrow('Target words must be greater than 0');
    });

    it('throws error for negative target words', () => {
      expect(() =>
        WritingGoal.create('goal-1', 'project-1', 'user-1', 'daily', -100)
      ).toThrow('Target words must be greater than 0');
    });

    it('throws error for non-integer target words', () => {
      expect(() =>
        WritingGoal.create('goal-1', 'project-1', 'user-1', 'daily', 500.5)
      ).toThrow('Target words must be an integer');
    });
  });

  describe('getProgress', () => {
    it('calculates progress percentage correctly', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getProgress(2500)).toBe(25);
      expect(goal.getProgress(5000)).toBe(50);
      expect(goal.getProgress(7500)).toBe(75);
    });

    it('caps progress at 100%', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getProgress(15000)).toBe(100);
    });

    it('returns 0 for zero current words', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getProgress(0)).toBe(0);
    });
  });

  describe('isCompleted', () => {
    it('returns true when current words meet target', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.isCompleted(10000)).toBe(true);
    });

    it('returns true when current words exceed target', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.isCompleted(12000)).toBe(true);
    });

    it('returns false when current words are below target', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.isCompleted(9999)).toBe(false);
    });
  });

  describe('getRemainingWords', () => {
    it('calculates remaining words correctly', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getRemainingWords(3000)).toBe(7000);
    });

    it('returns 0 when target is exceeded', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getRemainingWords(12000)).toBe(0);
    });
  });

  describe('isOverdue', () => {
    it('returns false when no deadline', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.isOverdue()).toBe(false);
    });

    it('returns true when deadline has passed', () => {
      const pastDeadline = new Date('2020-01-01');
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000,
        pastDeadline
      );

      expect(goal.isOverdue()).toBe(true);
    });

    it('returns false when deadline is in the future', () => {
      const futureDeadline = new Date('2030-12-31');
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000,
        futureDeadline
      );

      expect(goal.isOverdue()).toBe(false);
    });
  });

  describe('getDaysRemaining', () => {
    it('returns null when no deadline', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(goal.getDaysRemaining()).toBeNull();
    });

    it('returns negative days when overdue', () => {
      const pastDeadline = new Date('2020-01-01');
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000,
        pastDeadline
      );

      expect(goal.getDaysRemaining()).toBeLessThan(0);
    });
  });

  describe('updateTarget', () => {
    it('returns new instance with updated target', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      const updated = goal.updateTarget(20000);

      expect(updated.getTargetWords()).toBe(20000);
      expect(goal.getTargetWords()).toBe(10000); // Original unchanged
    });

    it('throws error for invalid target', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      expect(() => goal.updateTarget(0)).toThrow();
    });
  });

  describe('updateDeadline', () => {
    it('returns new instance with updated deadline', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      const newDeadline = new Date('2025-06-30');
      const updated = goal.updateDeadline(newDeadline);

      expect(updated.getDeadline()).toEqual(newDeadline);
      expect(goal.getDeadline()).toBeNull(); // Original unchanged
    });

    it('can clear deadline by passing null', () => {
      const deadline = new Date('2025-12-31');
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000,
        deadline
      );

      const updated = goal.updateDeadline(null);

      expect(updated.getDeadline()).toBeNull();
    });
  });

  describe('updateType', () => {
    it('returns new instance with updated type', () => {
      const goal = WritingGoal.create(
        'goal-1',
        'project-1',
        'user-1',
        'total',
        10000
      );

      const updated = goal.updateType('daily');

      expect(updated.getType()).toBe('daily');
      expect(goal.getType()).toBe('total'); // Original unchanged
    });
  });
});
