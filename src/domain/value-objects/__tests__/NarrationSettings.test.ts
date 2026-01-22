// ABOUTME: Tests for NarrationSettings value object
// ABOUTME: Verifies point of view, tense, and target audience enums

import { describe, it, expect } from 'vitest';
import {
  POINTS_OF_VIEW,
  NARRATION_TENSES,
  TARGET_AUDIENCES,
  isValidPointOfView,
  isValidNarrationTense,
  isValidTargetAudience,
  POINT_OF_VIEW_LABELS,
  NARRATION_TENSE_LABELS,
  TARGET_AUDIENCE_LABELS,
} from '../NarrationSettings';

describe('NarrationSettings', () => {
  describe('POINTS_OF_VIEW', () => {
    it('contains all expected points of view', () => {
      expect(POINTS_OF_VIEW).toContain('first_person');
      expect(POINTS_OF_VIEW).toContain('third_person_limited');
      expect(POINTS_OF_VIEW).toContain('third_person_omniscient');
      expect(POINTS_OF_VIEW).toHaveLength(3);
    });
  });

  describe('isValidPointOfView', () => {
    it('returns true for valid points of view', () => {
      expect(isValidPointOfView('first_person')).toBe(true);
      expect(isValidPointOfView('third_person_limited')).toBe(true);
      expect(isValidPointOfView('third_person_omniscient')).toBe(true);
    });

    it('returns false for invalid points of view', () => {
      expect(isValidPointOfView('invalid')).toBe(false);
      expect(isValidPointOfView('')).toBe(false);
      expect(isValidPointOfView('FIRST_PERSON')).toBe(false);
    });
  });

  describe('POINT_OF_VIEW_LABELS', () => {
    it('has French labels for all points of view', () => {
      expect(POINT_OF_VIEW_LABELS.first_person).toBe('Première personne');
      expect(POINT_OF_VIEW_LABELS.third_person_limited).toBe('Troisième personne limitée');
      expect(POINT_OF_VIEW_LABELS.third_person_omniscient).toBe('Omniscient');
    });
  });

  describe('NARRATION_TENSES', () => {
    it('contains all expected tenses', () => {
      expect(NARRATION_TENSES).toContain('past');
      expect(NARRATION_TENSES).toContain('present');
      expect(NARRATION_TENSES).toHaveLength(2);
    });
  });

  describe('isValidNarrationTense', () => {
    it('returns true for valid tenses', () => {
      expect(isValidNarrationTense('past')).toBe(true);
      expect(isValidNarrationTense('present')).toBe(true);
    });

    it('returns false for invalid tenses', () => {
      expect(isValidNarrationTense('invalid')).toBe(false);
      expect(isValidNarrationTense('')).toBe(false);
      expect(isValidNarrationTense('PAST')).toBe(false);
      expect(isValidNarrationTense('future')).toBe(false);
    });
  });

  describe('NARRATION_TENSE_LABELS', () => {
    it('has French labels for all tenses', () => {
      expect(NARRATION_TENSE_LABELS.past).toBe('Passé');
      expect(NARRATION_TENSE_LABELS.present).toBe('Présent');
    });
  });

  describe('TARGET_AUDIENCES', () => {
    it('contains all expected audiences', () => {
      expect(TARGET_AUDIENCES).toContain('adult');
      expect(TARGET_AUDIENCES).toContain('young_adult');
      expect(TARGET_AUDIENCES).toContain('children');
      expect(TARGET_AUDIENCES).toHaveLength(3);
    });
  });

  describe('isValidTargetAudience', () => {
    it('returns true for valid audiences', () => {
      expect(isValidTargetAudience('adult')).toBe(true);
      expect(isValidTargetAudience('young_adult')).toBe(true);
      expect(isValidTargetAudience('children')).toBe(true);
    });

    it('returns false for invalid audiences', () => {
      expect(isValidTargetAudience('invalid')).toBe(false);
      expect(isValidTargetAudience('')).toBe(false);
      expect(isValidTargetAudience('ADULT')).toBe(false);
    });
  });

  describe('TARGET_AUDIENCE_LABELS', () => {
    it('has French labels for all audiences', () => {
      expect(TARGET_AUDIENCE_LABELS.adult).toBe('Adulte');
      expect(TARGET_AUDIENCE_LABELS.young_adult).toBe('Young Adult');
      expect(TARGET_AUDIENCE_LABELS.children).toBe('Jeunesse');
    });
  });
});
