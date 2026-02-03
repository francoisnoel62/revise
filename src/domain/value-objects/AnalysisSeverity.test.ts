// ABOUTME: Test suite for AnalysisSeverity value object
// ABOUTME: Validates severity levels, priority ordering, and display properties

import { describe, it, expect } from 'vitest';
import {
  ANALYSIS_SEVERITIES,
  AnalysisSeverity,
  isValidAnalysisSeverity,
  ANALYSIS_SEVERITY_LABELS,
  ANALYSIS_SEVERITY_PRIORITY,
  ANALYSIS_SEVERITY_COLORS,
  compareSeverity,
} from './AnalysisSeverity';

describe('AnalysisSeverity', () => {
  describe('ANALYSIS_SEVERITIES', () => {
    it('should contain all three severity levels', () => {
      expect(ANALYSIS_SEVERITIES).toContain('error');
      expect(ANALYSIS_SEVERITIES).toContain('warning');
      expect(ANALYSIS_SEVERITIES).toContain('suggestion');
      expect(ANALYSIS_SEVERITIES).toHaveLength(3);
    });
  });

  describe('isValidAnalysisSeverity', () => {
    it('should return true for valid severities', () => {
      expect(isValidAnalysisSeverity('error')).toBe(true);
      expect(isValidAnalysisSeverity('warning')).toBe(true);
      expect(isValidAnalysisSeverity('suggestion')).toBe(true);
    });

    it('should return false for invalid severities', () => {
      expect(isValidAnalysisSeverity('invalid')).toBe(false);
      expect(isValidAnalysisSeverity('')).toBe(false);
      expect(isValidAnalysisSeverity('ERROR')).toBe(false);
      expect(isValidAnalysisSeverity('info')).toBe(false);
    });
  });

  describe('ANALYSIS_SEVERITY_LABELS', () => {
    it('should have French labels for all severities', () => {
      expect(ANALYSIS_SEVERITY_LABELS.error).toBe('Erreur');
      expect(ANALYSIS_SEVERITY_LABELS.warning).toBe('Attention');
      expect(ANALYSIS_SEVERITY_LABELS.suggestion).toBe('Suggestion');
    });
  });

  describe('ANALYSIS_SEVERITY_PRIORITY', () => {
    it('should have error as highest priority (lowest number)', () => {
      expect(ANALYSIS_SEVERITY_PRIORITY.error).toBe(0);
    });

    it('should have warning as medium priority', () => {
      expect(ANALYSIS_SEVERITY_PRIORITY.warning).toBe(1);
    });

    it('should have suggestion as lowest priority', () => {
      expect(ANALYSIS_SEVERITY_PRIORITY.suggestion).toBe(2);
    });

    it('should order error > warning > suggestion by priority', () => {
      expect(ANALYSIS_SEVERITY_PRIORITY.error).toBeLessThan(ANALYSIS_SEVERITY_PRIORITY.warning);
      expect(ANALYSIS_SEVERITY_PRIORITY.warning).toBeLessThan(ANALYSIS_SEVERITY_PRIORITY.suggestion);
    });
  });

  describe('ANALYSIS_SEVERITY_COLORS', () => {
    it('should have color identifiers for all severities', () => {
      expect(ANALYSIS_SEVERITY_COLORS.error).toBe('destructive');
      expect(ANALYSIS_SEVERITY_COLORS.warning).toBe('warning');
      expect(ANALYSIS_SEVERITY_COLORS.suggestion).toBe('info');
    });
  });

  describe('compareSeverity', () => {
    it('should return negative when first severity is higher priority', () => {
      expect(compareSeverity('error', 'warning')).toBeLessThan(0);
      expect(compareSeverity('error', 'suggestion')).toBeLessThan(0);
      expect(compareSeverity('warning', 'suggestion')).toBeLessThan(0);
    });

    it('should return positive when first severity is lower priority', () => {
      expect(compareSeverity('warning', 'error')).toBeGreaterThan(0);
      expect(compareSeverity('suggestion', 'error')).toBeGreaterThan(0);
      expect(compareSeverity('suggestion', 'warning')).toBeGreaterThan(0);
    });

    it('should return 0 when severities are equal', () => {
      expect(compareSeverity('error', 'error')).toBe(0);
      expect(compareSeverity('warning', 'warning')).toBe(0);
      expect(compareSeverity('suggestion', 'suggestion')).toBe(0);
    });
  });
});
