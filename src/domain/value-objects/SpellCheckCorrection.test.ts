// ABOUTME: Unit tests for SpellCheckCorrection value object
// ABOUTME: Tests construction, validation, and helper methods

import { describe, it, expect } from 'vitest';
import { SpellCheckCorrection, CorrectionType } from './SpellCheckCorrection';

describe('SpellCheckCorrection', () => {
  describe('construction', () => {
    it('should create a valid correction', () => {
      const correction = new SpellCheckCorrection({
        original: 'apartement',
        corrected: 'appartement',
        type: 'spelling',
        explanation: 'Faute d\'orthographe: il manque un "p"',
      });

      expect(correction.original).toBe('apartement');
      expect(correction.corrected).toBe('appartement');
      expect(correction.type).toBe('spelling');
      expect(correction.explanation).toBe('Faute d\'orthographe: il manque un "p"');
    });

    it('should accept position data', () => {
      const correction = new SpellCheckCorrection({
        original: 'error',
        corrected: 'erreur',
        type: 'spelling',
        explanation: 'Wrong language',
        position: { start: 10, end: 15 },
      });

      expect(correction.position).toEqual({ start: 10, end: 15 });
    });

    it('should throw on empty original', () => {
      expect(() => new SpellCheckCorrection({
        original: '',
        corrected: 'test',
        type: 'spelling',
        explanation: 'test',
      })).toThrow('Original text cannot be empty');
    });

    it('should throw on whitespace-only original', () => {
      expect(() => new SpellCheckCorrection({
        original: '   ',
        corrected: 'test',
        type: 'spelling',
        explanation: 'test',
      })).toThrow('Original text cannot be empty');
    });

    it('should throw on empty corrected', () => {
      expect(() => new SpellCheckCorrection({
        original: 'test',
        corrected: '',
        type: 'spelling',
        explanation: 'test',
      })).toThrow('Corrected text cannot be empty');
    });

    it('should throw on empty explanation', () => {
      expect(() => new SpellCheckCorrection({
        original: 'test',
        corrected: 'corrected',
        type: 'spelling',
        explanation: '',
      })).toThrow('Explanation cannot be empty');
    });
  });

  describe('hasChange', () => {
    it('should return true when text is different', () => {
      const correction = new SpellCheckCorrection({
        original: 'error',
        corrected: 'erreur',
        type: 'spelling',
        explanation: 'test',
      });

      expect(correction.hasChange()).toBe(true);
    });

    it('should return false when text is the same', () => {
      const correction = new SpellCheckCorrection({
        original: 'test',
        corrected: 'test',
        type: 'style',
        explanation: 'No change needed',
      });

      expect(correction.hasChange()).toBe(false);
    });
  });

  describe('getTypeLabel', () => {
    const testCases: Array<{ type: CorrectionType; expected: string }> = [
      { type: 'spelling', expected: 'Orthographe' },
      { type: 'grammar', expected: 'Grammaire' },
      { type: 'style', expected: 'Style' },
      { type: 'punctuation', expected: 'Ponctuation' },
    ];

    testCases.forEach(({ type, expected }) => {
      it(`should return "${expected}" for type "${type}"`, () => {
        const correction = new SpellCheckCorrection({
          original: 'test',
          corrected: 'corrected',
          type,
          explanation: 'test',
        });

        expect(correction.getTypeLabel()).toBe(expected);
      });
    });
  });
});
