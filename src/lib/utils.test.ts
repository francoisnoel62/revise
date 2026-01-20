// ABOUTME: Unit tests for utility functions.
// ABOUTME: Tests formatReadingTime function with various word counts.

import { describe, it, expect } from 'vitest';
import { formatReadingTime } from './utils';

describe('formatReadingTime', () => {
  describe('edge cases', () => {
    it('should return "< 1 min" for 0 words', () => {
      expect(formatReadingTime(0)).toBe('< 1 min');
    });

    it('should return "< 1 min" for negative word count', () => {
      expect(formatReadingTime(-100)).toBe('< 1 min');
    });
  });

  describe('minutes only (under 1 hour)', () => {
    it('should return "1 min" for 1-200 words', () => {
      expect(formatReadingTime(1)).toBe('1 min');
      expect(formatReadingTime(100)).toBe('1 min');
      expect(formatReadingTime(200)).toBe('1 min');
    });

    it('should return "2 min" for 201-400 words', () => {
      expect(formatReadingTime(201)).toBe('2 min');
      expect(formatReadingTime(400)).toBe('2 min');
    });

    it('should return "30 min" for ~6000 words', () => {
      expect(formatReadingTime(6000)).toBe('30 min');
    });

    it('should return "59 min" for 11800 words', () => {
      expect(formatReadingTime(11800)).toBe('59 min');
    });
  });

  describe('hours only (exact hours)', () => {
    it('should return "1 h" for exactly 12000 words (60 min)', () => {
      expect(formatReadingTime(12000)).toBe('1 h');
    });

    it('should return "2 h" for exactly 24000 words (120 min)', () => {
      expect(formatReadingTime(24000)).toBe('2 h');
    });
  });

  describe('hours and minutes', () => {
    it('should return "1 h 30 min" for 18000 words', () => {
      expect(formatReadingTime(18000)).toBe('1 h 30 min');
    });

    it('should return "1 h 1 min" for 12200 words', () => {
      expect(formatReadingTime(12200)).toBe('1 h 1 min');
    });

    it('should return "2 h 15 min" for 27000 words', () => {
      expect(formatReadingTime(27000)).toBe('2 h 15 min');
    });

    it('should handle typical novel length (~80000 words)', () => {
      // 80000 / 200 = 400 min = 6h 40min
      expect(formatReadingTime(80000)).toBe('6 h 40 min');
    });
  });

  describe('rounding behavior', () => {
    it('should round up to next minute', () => {
      // 201 words / 200 = 1.005 min, should round up to 2 min
      expect(formatReadingTime(201)).toBe('2 min');
    });

    it('should round up partial minutes in hours format', () => {
      // 12001 words / 200 = 60.005 min = 61 min = 1h 1min
      expect(formatReadingTime(12001)).toBe('1 h 1 min');
    });
  });
});
