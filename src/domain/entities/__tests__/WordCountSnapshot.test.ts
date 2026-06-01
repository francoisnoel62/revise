// ABOUTME: Tests for WordCountSnapshot entity
// ABOUTME: Covers creation, validation, and total word count updates

import { describe, it, expect } from 'vitest';
import { WordCountSnapshot } from '../WordCountSnapshot';

describe('WordCountSnapshot', () => {
  describe('create', () => {
    it('creates a snapshot with valid parameters', () => {
      const snapshot = WordCountSnapshot.create(
        'snap-1',
        'project-1',
        'user-1',
        '2026-05-31',
        62400
      );

      expect(snapshot.getId()).toBe('snap-1');
      expect(snapshot.getProjectId()).toBe('project-1');
      expect(snapshot.getOwnerId()).toBe('user-1');
      expect(snapshot.getLocalDate()).toBe('2026-05-31');
      expect(snapshot.getTotalWords()).toBe(62400);
    });

    it('allows a zero total word count', () => {
      const snapshot = WordCountSnapshot.create(
        'snap-1',
        'project-1',
        'user-1',
        '2026-05-31',
        0
      );

      expect(snapshot.getTotalWords()).toBe(0);
    });

    it('throws error for negative total words', () => {
      expect(() =>
        WordCountSnapshot.create('snap-1', 'project-1', 'user-1', '2026-05-31', -10)
      ).toThrow('Total words cannot be negative');
    });

    it('throws error for non-integer total words', () => {
      expect(() =>
        WordCountSnapshot.create('snap-1', 'project-1', 'user-1', '2026-05-31', 100.5)
      ).toThrow('Total words must be an integer');
    });

    it('throws error for an invalid local date format', () => {
      expect(() =>
        WordCountSnapshot.create('snap-1', 'project-1', 'user-1', '31/05/2026', 100)
      ).toThrow('Local date must be in YYYY-MM-DD format');
    });

    it('throws error for an impossible calendar date', () => {
      expect(() =>
        WordCountSnapshot.create('snap-1', 'project-1', 'user-1', '2026-13-40', 100)
      ).toThrow('Local date must be a valid calendar date');
    });
  });

  describe('reconstruct', () => {
    it('rebuilds a snapshot from persisted properties', () => {
      const createdAt = new Date('2026-05-31T08:00:00.000Z');
      const updatedAt = new Date('2026-05-31T20:00:00.000Z');
      const snapshot = WordCountSnapshot.reconstruct({
        id: 'snap-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        localDate: '2026-05-31',
        totalWords: 62400,
        createdAt,
        updatedAt,
      });

      expect(snapshot.getCreatedAt()).toEqual(createdAt);
      expect(snapshot.getUpdatedAt()).toEqual(updatedAt);
      expect(snapshot.getTotalWords()).toBe(62400);
    });
  });

  describe('updateTotalWords', () => {
    it('returns a new snapshot with the updated total and a fresh updatedAt', () => {
      const snapshot = WordCountSnapshot.create(
        'snap-1',
        'project-1',
        'user-1',
        '2026-05-31',
        62400
      );
      const originalUpdatedAt = snapshot.getUpdatedAt();

      const updated = snapshot.updateTotalWords(63000);

      expect(updated).not.toBe(snapshot);
      expect(updated.getTotalWords()).toBe(63000);
      expect(updated.getId()).toBe('snap-1');
      expect(updated.getLocalDate()).toBe('2026-05-31');
      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
      // Original is unchanged
      expect(snapshot.getTotalWords()).toBe(62400);
    });

    it('validates the new total word count', () => {
      const snapshot = WordCountSnapshot.create(
        'snap-1',
        'project-1',
        'user-1',
        '2026-05-31',
        62400
      );

      expect(() => snapshot.updateTotalWords(-1)).toThrow(
        'Total words cannot be negative'
      );
    });
  });
});
