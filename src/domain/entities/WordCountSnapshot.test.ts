// ABOUTME: Tests for WordCountSnapshot entity
// ABOUTME: Validates creation, date normalization, and word count rules

import { describe, it, expect } from 'vitest';
import {
  WordCountSnapshot,
  normalizeToParisDate,
  getWeekStartParis,
  getYesterdayParis,
} from './WordCountSnapshot';

describe('WordCountSnapshot', () => {
  const validId = '507f1f77bcf86cd799439011';
  const validProjectId = '507f1f77bcf86cd799439012';
  const validOwnerId = 'user-123';

  describe('create', () => {
    it('should create a snapshot with valid data', () => {
      const snapshot = WordCountSnapshot.create(
        validId,
        validProjectId,
        validOwnerId,
        1500
      );

      expect(snapshot.getId()).toBe(validId);
      expect(snapshot.getProjectId()).toBe(validProjectId);
      expect(snapshot.getOwnerId()).toBe(validOwnerId);
      expect(snapshot.getWordCount()).toBe(1500);
      expect(snapshot.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create a snapshot with zero word count', () => {
      const snapshot = WordCountSnapshot.create(
        validId,
        validProjectId,
        validOwnerId,
        0
      );

      expect(snapshot.getWordCount()).toBe(0);
    });

    it('should throw error for negative word count', () => {
      expect(() =>
        WordCountSnapshot.create(validId, validProjectId, validOwnerId, -100)
      ).toThrow('Word count cannot be negative');
    });

    it('should throw error for non-integer word count', () => {
      expect(() =>
        WordCountSnapshot.create(validId, validProjectId, validOwnerId, 100.5)
      ).toThrow('Word count must be an integer');
    });

    it('should normalize date to Paris midnight', () => {
      // Create at 3pm Paris time on Jan 22
      const date = new Date('2026-01-22T14:30:00.000Z');
      const snapshot = WordCountSnapshot.create(
        validId,
        validProjectId,
        validOwnerId,
        1000,
        date
      );

      const snapshotDate = snapshot.getDate();
      expect(snapshotDate.toISOString()).toBe('2026-01-22T00:00:00.000Z');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from properties', () => {
      const props = {
        id: validId,
        projectId: validProjectId,
        ownerId: validOwnerId,
        date: new Date('2026-01-22T00:00:00.000Z'),
        wordCount: 2000,
        createdAt: new Date('2026-01-22T15:30:00.000Z'),
      };

      const snapshot = WordCountSnapshot.reconstruct(props);

      expect(snapshot.getId()).toBe(props.id);
      expect(snapshot.getWordCount()).toBe(2000);
      expect(snapshot.getDate()).toEqual(props.date);
    });
  });

  describe('updateWordCount', () => {
    it('should return new instance with updated word count', () => {
      const original = WordCountSnapshot.create(
        validId,
        validProjectId,
        validOwnerId,
        1000
      );

      const updated = original.updateWordCount(1500);

      expect(updated.getWordCount()).toBe(1500);
      expect(original.getWordCount()).toBe(1000);
      expect(updated.getId()).toBe(original.getId());
    });

    it('should throw error for invalid new word count', () => {
      const snapshot = WordCountSnapshot.create(
        validId,
        validProjectId,
        validOwnerId,
        1000
      );

      expect(() => snapshot.updateWordCount(-50)).toThrow(
        'Word count cannot be negative'
      );
    });
  });
});

describe('normalizeToParisDate', () => {
  it('should normalize to midnight for same day in Paris', () => {
    // 10am UTC on Jan 22 = 11am Paris (same day)
    const date = new Date('2026-01-22T10:00:00.000Z');
    const normalized = normalizeToParisDate(date);

    expect(normalized.toISOString()).toBe('2026-01-22T00:00:00.000Z');
  });

  it('should handle late night UTC that is next day in Paris', () => {
    // 11pm UTC on Jan 21 = midnight Paris on Jan 22 (during winter, UTC+1)
    const date = new Date('2026-01-21T23:30:00.000Z');
    const normalized = normalizeToParisDate(date);

    // In Paris, this is already Jan 22 at 00:30
    expect(normalized.toISOString()).toBe('2026-01-22T00:00:00.000Z');
  });

  it('should handle summer time (UTC+2)', () => {
    // 10pm UTC on July 15 = midnight Paris on July 16 (during summer, UTC+2)
    const date = new Date('2026-07-15T22:30:00.000Z');
    const normalized = normalizeToParisDate(date);

    // In Paris, this is already July 16 at 00:30
    expect(normalized.toISOString()).toBe('2026-07-16T00:00:00.000Z');
  });
});

describe('getWeekStartParis', () => {
  it('should return Monday for a Thursday', () => {
    // Thursday Jan 22, 2026
    const thursday = new Date('2026-01-22T12:00:00.000Z');
    const monday = getWeekStartParis(thursday);

    // Monday Jan 19, 2026
    expect(monday.toISOString()).toBe('2026-01-19T00:00:00.000Z');
  });

  it('should return same day for a Monday', () => {
    // Monday Jan 19, 2026
    const mondayDate = new Date('2026-01-19T12:00:00.000Z');
    const monday = getWeekStartParis(mondayDate);

    expect(monday.toISOString()).toBe('2026-01-19T00:00:00.000Z');
  });

  it('should return previous Monday for a Sunday', () => {
    // Sunday Jan 25, 2026
    const sunday = new Date('2026-01-25T12:00:00.000Z');
    const monday = getWeekStartParis(sunday);

    // Monday Jan 19, 2026
    expect(monday.toISOString()).toBe('2026-01-19T00:00:00.000Z');
  });

  it('should handle week spanning month boundary', () => {
    // Friday Feb 6, 2026
    const friday = new Date('2026-02-06T12:00:00.000Z');
    const monday = getWeekStartParis(friday);

    // Monday Feb 2, 2026
    expect(monday.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });
});

describe('getYesterdayParis', () => {
  it('should return yesterday', () => {
    const today = new Date('2026-01-22T12:00:00.000Z');
    const yesterday = getYesterdayParis(today);

    expect(yesterday.toISOString()).toBe('2026-01-21T00:00:00.000Z');
  });

  it('should handle month boundary', () => {
    const firstOfMonth = new Date('2026-02-01T12:00:00.000Z');
    const yesterday = getYesterdayParis(firstOfMonth);

    expect(yesterday.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('should handle year boundary', () => {
    const firstOfYear = new Date('2026-01-01T12:00:00.000Z');
    const yesterday = getYesterdayParis(firstOfYear);

    expect(yesterday.toISOString()).toBe('2025-12-31T00:00:00.000Z');
  });
});
