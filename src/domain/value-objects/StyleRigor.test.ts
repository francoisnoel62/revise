// ABOUTME: Test suite for StyleRigor value object
// ABOUTME: Validates rigor levels, rules configuration, and display properties

import { describe, it, expect } from 'vitest';
import {
  STYLE_RIGOR_LEVELS,
  isValidStyleRigor,
  STYLE_RIGOR_LABELS,
  STYLE_RIGOR_DESCRIPTIONS,
  STYLE_RIGOR_RULES,
  getActiveRulesForRigor,
} from './StyleRigor';

describe('StyleRigor', () => {
  describe('STYLE_RIGOR_LEVELS', () => {
    it('should contain all three rigor levels', () => {
      expect(STYLE_RIGOR_LEVELS).toContain('permissive');
      expect(STYLE_RIGOR_LEVELS).toContain('moderate');
      expect(STYLE_RIGOR_LEVELS).toContain('strict');
      expect(STYLE_RIGOR_LEVELS).toHaveLength(3);
    });
  });

  describe('isValidStyleRigor', () => {
    it('should return true for valid rigor levels', () => {
      expect(isValidStyleRigor('permissive')).toBe(true);
      expect(isValidStyleRigor('moderate')).toBe(true);
      expect(isValidStyleRigor('strict')).toBe(true);
    });

    it('should return false for invalid rigor levels', () => {
      expect(isValidStyleRigor('invalid')).toBe(false);
      expect(isValidStyleRigor('')).toBe(false);
      expect(isValidStyleRigor('STRICT')).toBe(false);
      expect(isValidStyleRigor('normal')).toBe(false);
    });
  });

  describe('STYLE_RIGOR_LABELS', () => {
    it('should have French labels for all rigor levels', () => {
      expect(STYLE_RIGOR_LABELS.permissive).toBe('Permissif');
      expect(STYLE_RIGOR_LABELS.moderate).toBe('Modéré');
      expect(STYLE_RIGOR_LABELS.strict).toBe('Strict');
    });
  });

  describe('STYLE_RIGOR_DESCRIPTIONS', () => {
    it('should have descriptions for all rigor levels', () => {
      expect(STYLE_RIGOR_DESCRIPTIONS.permissive).toBeDefined();
      expect(STYLE_RIGOR_DESCRIPTIONS.moderate).toBeDefined();
      expect(STYLE_RIGOR_DESCRIPTIONS.strict).toBeDefined();
    });
  });

  describe('STYLE_RIGOR_RULES', () => {
    it('should define rules with rigor levels', () => {
      // Each rule should have an id, description, and minRigor
      for (const rule of STYLE_RIGOR_RULES) {
        expect(rule.id).toBeDefined();
        expect(typeof rule.id).toBe('string');
        expect(rule.description).toBeDefined();
        expect(typeof rule.description).toBe('string');
        expect(STYLE_RIGOR_LEVELS).toContain(rule.minRigor);
      }
    });

    it('should have basic rules active at permissive level', () => {
      const permissiveRules = STYLE_RIGOR_RULES.filter(r => r.minRigor === 'permissive');
      expect(permissiveRules.length).toBeGreaterThan(0);

      // Should include excessive passive voice and very long sentences
      const ruleIds = permissiveRules.map(r => r.id);
      expect(ruleIds).toContain('excessive-passive-voice');
      expect(ruleIds).toContain('very-long-sentences');
    });

    it('should have additional rules at moderate level', () => {
      const moderateRules = STYLE_RIGOR_RULES.filter(r => r.minRigor === 'moderate');
      expect(moderateRules.length).toBeGreaterThan(0);

      // Should include frequent adverbs
      const ruleIds = moderateRules.map(r => r.id);
      expect(ruleIds).toContain('frequent-adverbs');
      expect(ruleIds).toContain('repeated-structures');
    });

    it('should have strictest rules at strict level', () => {
      const strictRules = STYLE_RIGOR_RULES.filter(r => r.minRigor === 'strict');
      expect(strictRules.length).toBeGreaterThan(0);

      // Should include weak verbs, clichés, pleonasms
      const ruleIds = strictRules.map(r => r.id);
      expect(ruleIds).toContain('weak-verbs');
      expect(ruleIds).toContain('cliches');
      expect(ruleIds).toContain('pleonasms');
    });
  });

  describe('getActiveRulesForRigor', () => {
    it('should return only permissive rules for permissive level', () => {
      const rules = getActiveRulesForRigor('permissive');

      for (const rule of rules) {
        expect(rule.minRigor).toBe('permissive');
      }
    });

    it('should return permissive and moderate rules for moderate level', () => {
      const rules = getActiveRulesForRigor('moderate');

      for (const rule of rules) {
        expect(['permissive', 'moderate']).toContain(rule.minRigor);
      }

      // Should have both permissive and moderate rules
      const hasPermissive = rules.some(r => r.minRigor === 'permissive');
      const hasModerate = rules.some(r => r.minRigor === 'moderate');
      expect(hasPermissive).toBe(true);
      expect(hasModerate).toBe(true);
    });

    it('should return all rules for strict level', () => {
      const rules = getActiveRulesForRigor('strict');

      expect(rules.length).toBe(STYLE_RIGOR_RULES.length);
    });

    it('should return progressively more rules as rigor increases', () => {
      const permissiveCount = getActiveRulesForRigor('permissive').length;
      const moderateCount = getActiveRulesForRigor('moderate').length;
      const strictCount = getActiveRulesForRigor('strict').length;

      expect(permissiveCount).toBeLessThan(moderateCount);
      expect(moderateCount).toBeLessThan(strictCount);
    });
  });
});
