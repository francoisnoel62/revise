// ABOUTME: Tests for RelatedWork value object
// ABOUTME: Verifies related work structure and validation

import { describe, it, expect } from 'vitest';
import {
  RelatedWork,
  createRelatedWork,
  isValidRelatedWork,
} from '../RelatedWork';

describe('RelatedWork', () => {
  describe('createRelatedWork', () => {
    it('creates a valid related work with title only', () => {
      const work = createRelatedWork('Previous Novel');
      expect(work.title).toBe('Previous Novel');
      expect(work.projectId).toBeUndefined();
    });

    it('creates a valid related work with title and projectId', () => {
      const work = createRelatedWork('Previous Novel', 'proj-123');
      expect(work.title).toBe('Previous Novel');
      expect(work.projectId).toBe('proj-123');
    });

    it('trims whitespace from title', () => {
      const work = createRelatedWork('  Previous Novel  ');
      expect(work.title).toBe('Previous Novel');
    });

    it('trims whitespace from projectId', () => {
      const work = createRelatedWork('Previous Novel', '  proj-123  ');
      expect(work.projectId).toBe('proj-123');
    });

    it('throws error for empty title', () => {
      expect(() => createRelatedWork('')).toThrow('Related work title cannot be empty');
    });

    it('throws error for whitespace-only title', () => {
      expect(() => createRelatedWork('   ')).toThrow('Related work title cannot be empty');
    });

    it('converts empty projectId to undefined', () => {
      const work = createRelatedWork('Previous Novel', '');
      expect(work.projectId).toBeUndefined();
    });

    it('converts whitespace-only projectId to undefined', () => {
      const work = createRelatedWork('Previous Novel', '   ');
      expect(work.projectId).toBeUndefined();
    });
  });

  describe('isValidRelatedWork', () => {
    it('returns true for valid related work with title only', () => {
      const work: RelatedWork = { title: 'Previous Novel' };
      expect(isValidRelatedWork(work)).toBe(true);
    });

    it('returns true for valid related work with title and projectId', () => {
      const work: RelatedWork = { title: 'Previous Novel', projectId: 'proj-123' };
      expect(isValidRelatedWork(work)).toBe(true);
    });

    it('returns false for empty title', () => {
      const work = { title: '' };
      expect(isValidRelatedWork(work as RelatedWork)).toBe(false);
    });

    it('returns false for missing title', () => {
      expect(isValidRelatedWork({} as RelatedWork)).toBe(false);
    });

    it('returns true for undefined projectId', () => {
      const work: RelatedWork = { title: 'Novel', projectId: undefined };
      expect(isValidRelatedWork(work)).toBe(true);
    });
  });
});
