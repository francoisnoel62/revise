// ABOUTME: Test suite for RepetitionExclusions value object
// ABOUTME: Validates exclusion management from multiple sources (characters, places, user-defined)

import { describe, it, expect } from 'vitest';
import { createRepetitionExclusions } from './RepetitionExclusions';

describe('RepetitionExclusions', () => {
  describe('createRepetitionExclusions', () => {
    it('should create empty exclusions by default', () => {
      const exclusions = createRepetitionExclusions();

      expect(exclusions.getAll()).toHaveLength(0);
    });

    it('should create exclusions with initial data', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean', 'Marie'],
        placeNames: ['Paris', 'Lyon'],
        userExclusions: ['magie'],
      });

      expect(exclusions.getAll()).toHaveLength(5);
    });

    it('should normalize words to lowercase', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean', 'MARIE'],
      });

      expect(exclusions.isExcluded('jean')).toBe(true);
      expect(exclusions.isExcluded('marie')).toBe(true);
      expect(exclusions.isExcluded('Jean')).toBe(true);
      expect(exclusions.isExcluded('JEAN')).toBe(true);
    });
  });

  describe('isExcluded', () => {
    it('should return true for excluded character names', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean', 'Marie'],
      });

      expect(exclusions.isExcluded('Jean')).toBe(true);
      expect(exclusions.isExcluded('Marie')).toBe(true);
    });

    it('should return true for excluded place names', () => {
      const exclusions = createRepetitionExclusions({
        placeNames: ['Paris', 'Lyon'],
      });

      expect(exclusions.isExcluded('Paris')).toBe(true);
      expect(exclusions.isExcluded('Lyon')).toBe(true);
    });

    it('should return true for user-defined exclusions', () => {
      const exclusions = createRepetitionExclusions({
        userExclusions: ['magie', 'sortilège'],
      });

      expect(exclusions.isExcluded('magie')).toBe(true);
      expect(exclusions.isExcluded('sortilège')).toBe(true);
    });

    it('should return false for non-excluded words', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
      });

      expect(exclusions.isExcluded('soudain')).toBe(false);
      expect(exclusions.isExcluded('Pierre')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
      });

      expect(exclusions.isExcluded('jean')).toBe(true);
      expect(exclusions.isExcluded('JEAN')).toBe(true);
      expect(exclusions.isExcluded('JeAn')).toBe(true);
    });
  });

  describe('getSource', () => {
    it('should return correct source for character names', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
      });

      expect(exclusions.getSource('Jean')).toBe('character');
    });

    it('should return correct source for place names', () => {
      const exclusions = createRepetitionExclusions({
        placeNames: ['Paris'],
      });

      expect(exclusions.getSource('Paris')).toBe('place');
    });

    it('should return correct source for user exclusions', () => {
      const exclusions = createRepetitionExclusions({
        userExclusions: ['magie'],
      });

      expect(exclusions.getSource('magie')).toBe('user');
    });

    it('should return null for non-excluded words', () => {
      const exclusions = createRepetitionExclusions();

      expect(exclusions.getSource('soudain')).toBeNull();
    });
  });

  describe('addUserExclusion', () => {
    it('should add a new user exclusion (immutably)', () => {
      const exclusions = createRepetitionExclusions();
      const updated = exclusions.addUserExclusion('magie');

      expect(updated.isExcluded('magie')).toBe(true);
      expect(exclusions.isExcluded('magie')).toBe(false); // Original unchanged
    });

    it('should not add duplicate exclusions', () => {
      const exclusions = createRepetitionExclusions({
        userExclusions: ['magie'],
      });
      const updated = exclusions.addUserExclusion('magie');

      expect(updated.getUserExclusions()).toHaveLength(1);
    });

    it('should not add if already excluded as character', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
      });
      const updated = exclusions.addUserExclusion('Jean');

      expect(updated.getUserExclusions()).toHaveLength(0);
      expect(updated.getSource('Jean')).toBe('character');
    });
  });

  describe('removeUserExclusion', () => {
    it('should remove a user exclusion (immutably)', () => {
      const exclusions = createRepetitionExclusions({
        userExclusions: ['magie', 'sortilège'],
      });
      const updated = exclusions.removeUserExclusion('magie');

      expect(updated.isExcluded('magie')).toBe(false);
      expect(updated.isExcluded('sortilège')).toBe(true);
      expect(exclusions.isExcluded('magie')).toBe(true); // Original unchanged
    });

    it('should not affect non-user exclusions', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
      });
      const updated = exclusions.removeUserExclusion('Jean');

      expect(updated.isExcluded('Jean')).toBe(true); // Still excluded as character
    });
  });

  describe('getter methods', () => {
    it('should return character names', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean', 'Marie'],
      });

      expect(exclusions.getCharacterNames()).toEqual(['jean', 'marie']);
    });

    it('should return place names', () => {
      const exclusions = createRepetitionExclusions({
        placeNames: ['Paris', 'Lyon'],
      });

      expect(exclusions.getPlaceNames()).toEqual(['paris', 'lyon']);
    });

    it('should return user exclusions', () => {
      const exclusions = createRepetitionExclusions({
        userExclusions: ['magie'],
      });

      expect(exclusions.getUserExclusions()).toEqual(['magie']);
    });

    it('should return all exclusions', () => {
      const exclusions = createRepetitionExclusions({
        characterNames: ['Jean'],
        placeNames: ['Paris'],
        userExclusions: ['magie'],
      });

      const all = exclusions.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContain('jean');
      expect(all).toContain('paris');
      expect(all).toContain('magie');
    });
  });

  describe('mergeWith', () => {
    it('should merge two exclusion sets', () => {
      const exclusions1 = createRepetitionExclusions({
        characterNames: ['Jean'],
      });
      const exclusions2 = createRepetitionExclusions({
        characterNames: ['Marie'],
        placeNames: ['Paris'],
      });

      const merged = exclusions1.mergeWith(exclusions2);

      expect(merged.isExcluded('Jean')).toBe(true);
      expect(merged.isExcluded('Marie')).toBe(true);
      expect(merged.isExcluded('Paris')).toBe(true);
    });

    it('should not create duplicates when merging', () => {
      const exclusions1 = createRepetitionExclusions({
        characterNames: ['Jean'],
      });
      const exclusions2 = createRepetitionExclusions({
        characterNames: ['Jean', 'Marie'],
      });

      const merged = exclusions1.mergeWith(exclusions2);

      expect(merged.getCharacterNames()).toHaveLength(2);
    });
  });
});
