// ABOUTME: Tests for TaskStatus value object
// ABOUTME: Verifies status constants, validation, and ordering

import { describe, it, expect } from 'vitest';
import {
  TASK_STATUSES,
  isValidTaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from '../TaskStatus';

describe('TaskStatus', () => {
  describe('TASK_STATUSES', () => {
    it('contains all expected statuses', () => {
      expect(TASK_STATUSES).toContain('todo');
      expect(TASK_STATUSES).toContain('in_progress');
      expect(TASK_STATUSES).toContain('done');
      expect(TASK_STATUSES).toHaveLength(3);
    });
  });

  describe('isValidTaskStatus', () => {
    it('returns true for valid statuses', () => {
      expect(isValidTaskStatus('todo')).toBe(true);
      expect(isValidTaskStatus('in_progress')).toBe(true);
      expect(isValidTaskStatus('done')).toBe(true);
    });

    it('returns false for invalid statuses', () => {
      expect(isValidTaskStatus('invalid')).toBe(false);
      expect(isValidTaskStatus('')).toBe(false);
      expect(isValidTaskStatus('TODO')).toBe(false);
      expect(isValidTaskStatus('pending')).toBe(false);
    });
  });

  describe('TASK_STATUS_LABELS', () => {
    it('has French labels for all statuses', () => {
      expect(TASK_STATUS_LABELS.todo).toBe('À faire');
      expect(TASK_STATUS_LABELS.in_progress).toBe('En cours');
      expect(TASK_STATUS_LABELS.done).toBe('Terminé');
    });
  });

  describe('TASK_STATUS_ORDER', () => {
    it('orders in_progress first, then todo, then done', () => {
      expect(TASK_STATUS_ORDER.in_progress).toBeLessThan(TASK_STATUS_ORDER.todo);
      expect(TASK_STATUS_ORDER.todo).toBeLessThan(TASK_STATUS_ORDER.done);
    });
  });
});
