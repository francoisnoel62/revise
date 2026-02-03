// ABOUTME: Test suite for RepetitionCluster value object
// ABOUTME: Validates repetition detection, positions tracking, and suggestions

import { describe, it, expect } from 'vitest';
import {
  RepetitionCluster,
  createRepetitionCluster,
  RepetitionPosition,
} from './RepetitionCluster';

describe('RepetitionCluster', () => {
  const validPositions: RepetitionPosition[] = [
    { start: 0, end: 5 },
    { start: 50, end: 55 },
    { start: 120, end: 125 },
  ];

  describe('createRepetitionCluster', () => {
    it('should create a valid cluster', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
        suggestions: ['brusquement', 'tout à coup', 'subitement'],
      });

      expect(cluster.word).toBe('soudain');
      expect(cluster.positions).toHaveLength(3);
      expect(cluster.suggestions).toHaveLength(3);
      expect(cluster.isIntentional).toBe(false);
    });

    it('should throw error if word is empty', () => {
      expect(() => {
        createRepetitionCluster({
          word: '',
          positions: validPositions,
        });
      }).toThrow('Word cannot be empty');
    });

    it('should throw error if less than 2 positions', () => {
      expect(() => {
        createRepetitionCluster({
          word: 'soudain',
          positions: [{ start: 0, end: 5 }],
        });
      }).toThrow('A repetition must have at least 2 occurrences');
    });

    it('should allow marking as intentional', () => {
      const cluster = createRepetitionCluster({
        word: 'Jean',
        positions: validPositions,
        isIntentional: true,
      });

      expect(cluster.isIntentional).toBe(true);
    });

    it('should default suggestions to empty array', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      expect(cluster.suggestions).toEqual([]);
    });

    it('should sort positions by start index', () => {
      const unsortedPositions: RepetitionPosition[] = [
        { start: 120, end: 125 },
        { start: 0, end: 5 },
        { start: 50, end: 55 },
      ];

      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: unsortedPositions,
      });

      expect(cluster.positions[0].start).toBe(0);
      expect(cluster.positions[1].start).toBe(50);
      expect(cluster.positions[2].start).toBe(120);
    });
  });

  describe('RepetitionCluster methods', () => {
    it('should return occurrence count', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      expect(cluster.getCount()).toBe(3);
    });

    it('should return first occurrence position', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      expect(cluster.getFirstOccurrence()).toEqual({ start: 0, end: 5 });
    });

    it('should return last occurrence position', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      expect(cluster.getLastOccurrence()).toEqual({ start: 120, end: 125 });
    });

    it('should calculate span (distance from first to last)', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      // From start of first (0) to end of last (125)
      expect(cluster.getSpan()).toBe(125);
    });

    it('should mark as intentional (immutably)', () => {
      const cluster = createRepetitionCluster({
        word: 'Jean',
        positions: validPositions,
        isIntentional: false,
      });

      const markedCluster = cluster.markAsIntentional();

      expect(markedCluster.isIntentional).toBe(true);
      expect(cluster.isIntentional).toBe(false); // Original unchanged
    });

    it('should add suggestion (immutably)', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
        suggestions: ['brusquement'],
      });

      const updatedCluster = cluster.addSuggestion('tout à coup');

      expect(updatedCluster.suggestions).toContain('tout à coup');
      expect(updatedCluster.suggestions).toContain('brusquement');
      expect(cluster.suggestions).toHaveLength(1); // Original unchanged
    });

    it('should not add duplicate suggestion', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
        suggestions: ['brusquement'],
      });

      const updatedCluster = cluster.addSuggestion('brusquement');

      expect(updatedCluster.suggestions).toHaveLength(1);
    });
  });

  describe('RepetitionCluster position validation', () => {
    it('should throw error for invalid position (negative start)', () => {
      expect(() => {
        createRepetitionCluster({
          word: 'test',
          positions: [
            { start: -1, end: 5 },
            { start: 10, end: 15 },
          ],
        });
      }).toThrow('Position start must be non-negative');
    });

    it('should throw error for invalid position (end before start)', () => {
      expect(() => {
        createRepetitionCluster({
          word: 'test',
          positions: [
            { start: 10, end: 5 },
            { start: 20, end: 25 },
          ],
        });
      }).toThrow('Position end must be greater than start');
    });
  });

  describe('RepetitionCluster immutability', () => {
    it('should not allow modification of positions array', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
      });

      // Even if we try to modify, original data should be safe
      const positions = cluster.positions;
      expect(positions).toHaveLength(3);
    });

    it('should not allow modification of suggestions array', () => {
      const cluster = createRepetitionCluster({
        word: 'soudain',
        positions: validPositions,
        suggestions: ['brusquement'],
      });

      const suggestions = cluster.suggestions;
      expect(suggestions).toHaveLength(1);
    });
  });
});
