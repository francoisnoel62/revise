// ABOUTME: Tests for AIOperationType value object
// ABOUTME: Covers validation, labels, and type guards

import { describe, it, expect } from 'vitest';
import {
  AI_OPERATION_TYPES,
  isValidAIOperationType,
  AI_OPERATION_LABELS,
} from '../AIOperationType';

describe('AIOperationType', () => {
  describe('AI_OPERATION_TYPES', () => {
    it('contains all expected operation types', () => {
      expect(AI_OPERATION_TYPES).toContain('rewrite');
      expect(AI_OPERATION_TYPES).toContain('narrative_analysis');
      expect(AI_OPERATION_TYPES).toContain('stylistic_dna');
      expect(AI_OPERATION_TYPES).toContain('characters');
      expect(AI_OPERATION_TYPES).toContain('plot');
      expect(AI_OPERATION_TYPES).toContain('worldbuilding');
      expect(AI_OPERATION_TYPES).toContain('synthesis');
      expect(AI_OPERATION_TYPES).toContain('chapter_summaries');
      expect(AI_OPERATION_TYPES).toContain('chapter_generation');
      expect(AI_OPERATION_TYPES).toContain('completion');
    });

    it('has exactly 10 operation types', () => {
      expect(AI_OPERATION_TYPES).toHaveLength(10);
    });
  });

  describe('isValidAIOperationType', () => {
    it('returns true for valid operation types', () => {
      expect(isValidAIOperationType('rewrite')).toBe(true);
      expect(isValidAIOperationType('narrative_analysis')).toBe(true);
      expect(isValidAIOperationType('completion')).toBe(true);
    });

    it('returns false for invalid operation types', () => {
      expect(isValidAIOperationType('invalid')).toBe(false);
      expect(isValidAIOperationType('')).toBe(false);
      expect(isValidAIOperationType('REWRITE')).toBe(false);
    });
  });

  describe('AI_OPERATION_LABELS', () => {
    it('has French labels for all operation types', () => {
      for (const opType of AI_OPERATION_TYPES) {
        expect(AI_OPERATION_LABELS[opType]).toBeDefined();
        expect(typeof AI_OPERATION_LABELS[opType]).toBe('string');
        expect(AI_OPERATION_LABELS[opType].length).toBeGreaterThan(0);
      }
    });

    it('has expected French labels', () => {
      expect(AI_OPERATION_LABELS.rewrite).toBe('Réécriture');
      expect(AI_OPERATION_LABELS.narrative_analysis).toBe('Analyse narrative');
      expect(AI_OPERATION_LABELS.completion).toBe('Autocomplétion');
    });
  });
});
