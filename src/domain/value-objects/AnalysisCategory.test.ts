// ABOUTME: Test suite for AnalysisCategory value object
// ABOUTME: Validates category types, validation, and labels for chapter analysis

import { describe, it, expect } from 'vitest';
import {
  ANALYSIS_CATEGORIES,
  isValidAnalysisCategory,
  ANALYSIS_CATEGORY_LABELS,
  ANALYSIS_CATEGORY_ORDER,
} from './AnalysisCategory';

describe('AnalysisCategory', () => {
  describe('ANALYSIS_CATEGORIES', () => {
    it('should only contain what asks the AI to understand the text', () => {
      expect([...ANALYSIS_CATEGORIES]).toEqual(['repetition', 'style']);
    });

    it('should leave the mechanical categories to the local grammar engine', () => {
      expect(isValidAnalysisCategory('spelling')).toBe(false);
      expect(isValidAnalysisCategory('grammar')).toBe(false);
      expect(isValidAnalysisCategory('punctuation')).toBe(false);
    });
  });

  describe('isValidAnalysisCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidAnalysisCategory('repetition')).toBe(true);
      expect(isValidAnalysisCategory('style')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidAnalysisCategory('invalid')).toBe(false);
      expect(isValidAnalysisCategory('')).toBe(false);
      expect(isValidAnalysisCategory('readability')).toBe(false);
    });
  });

  describe('ANALYSIS_CATEGORY_LABELS', () => {
    it('should have French labels for all categories', () => {
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

  describe('ANALYSIS_CATEGORY_ORDER', () => {
    it('should define display order for all categories', () => {
      expect(ANALYSIS_CATEGORY_ORDER.repetition).toBe(0);
      expect(ANALYSIS_CATEGORY_ORDER.style).toBe(1);
    });

    it('should have unique order values', () => {
      const orders = Object.values(ANALYSIS_CATEGORY_ORDER);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });
});
