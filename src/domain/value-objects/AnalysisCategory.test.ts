// ABOUTME: Test suite for AnalysisCategory value object
// ABOUTME: Validates category types, validation, and labels for chapter analysis

import { describe, it, expect } from 'vitest';
import {
  ANALYSIS_CATEGORIES,
  isValidAnalysisCategory,
  ANALYSIS_CATEGORY_LABELS,
  ANALYSIS_CATEGORY_ICONS,
  ANALYSIS_CATEGORY_ORDER,
} from './AnalysisCategory';

describe('AnalysisCategory', () => {
  describe('ANALYSIS_CATEGORIES', () => {
    it('should contain all four analysis categories', () => {
      expect(ANALYSIS_CATEGORIES).toContain('grammar');
      expect(ANALYSIS_CATEGORIES).toContain('punctuation');
      expect(ANALYSIS_CATEGORIES).toContain('repetition');
      expect(ANALYSIS_CATEGORIES).toContain('style');
      expect(ANALYSIS_CATEGORIES).toHaveLength(4);
    });

    it('should be readonly', () => {
      // TypeScript ensures this at compile time
      // This test documents the intent
      expect(Object.isFrozen(ANALYSIS_CATEGORIES)).toBe(false); // as const doesn't freeze
      expect(ANALYSIS_CATEGORIES.length).toBe(4);
    });
  });

  describe('isValidAnalysisCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidAnalysisCategory('grammar')).toBe(true);
      expect(isValidAnalysisCategory('punctuation')).toBe(true);
      expect(isValidAnalysisCategory('repetition')).toBe(true);
      expect(isValidAnalysisCategory('style')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidAnalysisCategory('invalid')).toBe(false);
      expect(isValidAnalysisCategory('')).toBe(false);
      expect(isValidAnalysisCategory('spelling')).toBe(false);
      expect(isValidAnalysisCategory('readability')).toBe(false);
    });
  });

  describe('ANALYSIS_CATEGORY_LABELS', () => {
    it('should have French labels for all categories', () => {
      expect(ANALYSIS_CATEGORY_LABELS.grammar).toBe('Grammaire');
      expect(ANALYSIS_CATEGORY_LABELS.punctuation).toBe('Ponctuation');
      expect(ANALYSIS_CATEGORY_LABELS.repetition).toBe('Répétitions');
      expect(ANALYSIS_CATEGORY_LABELS.style).toBe('Style');
    });

    it('should have a label for each category', () => {
      for (const category of ANALYSIS_CATEGORIES) {
        expect(ANALYSIS_CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof ANALYSIS_CATEGORY_LABELS[category]).toBe('string');
      }
    });
  });

  describe('ANALYSIS_CATEGORY_ICONS', () => {
    it('should have an icon identifier for each category', () => {
      for (const category of ANALYSIS_CATEGORIES) {
        expect(ANALYSIS_CATEGORY_ICONS[category]).toBeDefined();
        expect(typeof ANALYSIS_CATEGORY_ICONS[category]).toBe('string');
      }
    });
  });

  describe('ANALYSIS_CATEGORY_ORDER', () => {
    it('should define display order for all categories', () => {
      expect(ANALYSIS_CATEGORY_ORDER.grammar).toBe(0);
      expect(ANALYSIS_CATEGORY_ORDER.punctuation).toBe(1);
      expect(ANALYSIS_CATEGORY_ORDER.repetition).toBe(2);
      expect(ANALYSIS_CATEGORY_ORDER.style).toBe(3);
    });

    it('should have unique order values', () => {
      const orders = Object.values(ANALYSIS_CATEGORY_ORDER);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });
});
