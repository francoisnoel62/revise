// ABOUTME: Tests for TaskPriority value object
// ABOUTME: Verifies priority constants, validation, and ordering

import { describe, it, expect } from 'vitest';
import {
  TASK_PRIORITIES,
  isValidTaskPriority,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
} from '../TaskPriority';

describe('TaskPriority', () => {
  describe('TASK_PRIORITIES', () => {
    it('contains all expected priorities', () => {
      expect(TASK_PRIORITIES).toContain('low');
      expect(TASK_PRIORITIES).toContain('medium');
      expect(TASK_PRIORITIES).toContain('high');
      expect(TASK_PRIORITIES).toHaveLength(3);
    });
  });

  describe('isValidTaskPriority', () => {
    it('returns true for valid priorities', () => {
      expect(isValidTaskPriority('low')).toBe(true);
      expect(isValidTaskPriority('medium')).toBe(true);
      expect(isValidTaskPriority('high')).toBe(true);
    });

    it('returns false for invalid priorities', () => {
      expect(isValidTaskPriority('invalid')).toBe(false);
      expect(isValidTaskPriority('')).toBe(false);
      expect(isValidTaskPriority('HIGH')).toBe(false);
      expect(isValidTaskPriority('urgent')).toBe(false);
    });
  });

  describe('TASK_PRIORITY_LABELS', () => {
    it('has French labels for all priorities', () => {
      expect(TASK_PRIORITY_LABELS.low).toBe('Basse');
      expect(TASK_PRIORITY_LABELS.medium).toBe('Moyenne');
      expect(TASK_PRIORITY_LABELS.high).toBe('Haute');
    });
  });

  describe('TASK_PRIORITY_ORDER', () => {
    it('orders high first, then medium, then low', () => {
      expect(TASK_PRIORITY_ORDER.high).toBeLessThan(TASK_PRIORITY_ORDER.medium);
      expect(TASK_PRIORITY_ORDER.medium).toBeLessThan(TASK_PRIORITY_ORDER.low);
    });
  });
});
