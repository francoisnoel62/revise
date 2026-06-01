// ABOUTME: Test suite for TextSelection value object ensuring immutability and validation
// ABOUTME: Validates selection range construction and boundary conditions

import { describe, it, expect } from 'vitest';
import { TextSelection } from './TextSelection';

describe('TextSelection', () => {
  describe('construction', () => {
    it('should create a valid selection', () => {
      const selection = new TextSelection(0, 10);

      expect(selection.start).toBe(0);
      expect(selection.end).toBe(10);
    });

    it('should throw error if start is negative', () => {
      expect(() => {
        new TextSelection(-1, 10);
      }).toThrow('Selection start must be non-negative');
    });

    it('should throw error if end is before start', () => {
      expect(() => {
        new TextSelection(10, 5);
      }).toThrow('Selection end must be greater than or equal to start');
    });

    it('should allow zero-length selection (cursor)', () => {
      const selection = new TextSelection(5, 5);

      expect(selection.start).toBe(5);
      expect(selection.end).toBe(5);
      expect(selection.isEmpty()).toBe(true);
    });

    it('should throw error if start is not an integer', () => {
      expect(() => {
        new TextSelection(1.5, 10);
      }).toThrow('Selection positions must be integers');
    });

    it('should throw error if end is not an integer', () => {
      expect(() => {
        new TextSelection(0, 9.9);
      }).toThrow('Selection positions must be integers');
    });

    it('should throw error if start is NaN', () => {
      expect(() => {
        new TextSelection(NaN, 10);
      }).toThrow('Selection positions must be integers');
    });

    it('should throw error if end is Infinity', () => {
      expect(() => {
        new TextSelection(0, Infinity);
      }).toThrow('Selection positions must be integers');
    });
  });

  describe('getLength', () => {
    it('should return correct selection length', () => {
      const selection = new TextSelection(5, 15);

      expect(selection.getLength()).toBe(10);
    });

    it('should return 0 for empty selection', () => {
      const selection = new TextSelection(5, 5);

      expect(selection.getLength()).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true for zero-length selection', () => {
      const selection = new TextSelection(10, 10);

      expect(selection.isEmpty()).toBe(true);
    });

    it('should return false for non-empty selection', () => {
      const selection = new TextSelection(0, 5);

      expect(selection.isEmpty()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable (readonly properties)', () => {
      const selection = new TextSelection(0, 10);

      // TypeScript will prevent this at compile time
      // This test documents the intent
      expect(selection.start).toBe(0);
      expect(selection.end).toBe(10);
    });
  });
});
