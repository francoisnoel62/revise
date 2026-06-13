// ABOUTME: Tests for WordAlternative value object
// ABOUTME: Covers construction, validation, optional fields, and factory function

import { describe, it, expect } from 'vitest';
import { WordAlternative, createWordAlternative } from '../WordAlternative';

describe('WordAlternative', () => {
  describe('constructor', () => {
    it('creates instance with all fields', () => {
      const alt = new WordAlternative({
        word: 'épier',
        sceneEffect: 'installe une menace silencieuse',
        register: 'courant',
      });
      expect(alt.word).toBe('épier');
      expect(alt.sceneEffect).toBe('installe une menace silencieuse');
      expect(alt.register).toBe('courant');
    });

    it('creates instance without register', () => {
      const alt = new WordAlternative({ word: 'scruter', sceneEffect: "accentue l'intensité" });
      expect(alt.word).toBe('scruter');
      expect(alt.register).toBeUndefined();
    });

    it('trims word and sceneEffect', () => {
      const alt = new WordAlternative({ word: '  observer  ', sceneEffect: '  neutre  ' });
      expect(alt.word).toBe('observer');
      expect(alt.sceneEffect).toBe('neutre');
    });

    it('throws when word is empty', () => {
      expect(() => new WordAlternative({ word: '', sceneEffect: 'effet' })).toThrow(
        'WordAlternative word cannot be empty',
      );
    });

    it('throws when word is whitespace only', () => {
      expect(() => new WordAlternative({ word: '   ', sceneEffect: 'effet' })).toThrow(
        'WordAlternative word cannot be empty',
      );
    });

    it('throws when sceneEffect is empty', () => {
      expect(() => new WordAlternative({ word: 'mot', sceneEffect: '' })).toThrow(
        'WordAlternative sceneEffect cannot be empty',
      );
    });

    it('throws when sceneEffect is whitespace only', () => {
      expect(() => new WordAlternative({ word: 'mot', sceneEffect: '   ' })).toThrow(
        'WordAlternative sceneEffect cannot be empty',
      );
    });

    it('stores undefined for whitespace-only register', () => {
      const alt = new WordAlternative({ word: 'mot', sceneEffect: 'effet', register: '   ' });
      expect(alt.register).toBeUndefined();
    });
  });

  describe('createWordAlternative', () => {
    it('returns the same result as new WordAlternative', () => {
      const data = { word: 'contempler', sceneEffect: "exprime l'admiration" };
      const fromFactory = createWordAlternative(data);
      const fromNew = new WordAlternative(data);
      expect(fromFactory.word).toBe(fromNew.word);
      expect(fromFactory.sceneEffect).toBe(fromNew.sceneEffect);
    });
  });
});
