// ABOUTME: Test suite for the project's grammar rule-family profile.
// ABOUTME: Covers reading and switching the punctuation families as one option.

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
  PUNCTUATION_RULE_FAMILIES,
  isPunctuationChecked,
  withPunctuationChecked,
} from './GrammarRuleProfile';

describe('punctuation as one option', () => {
  it('checks punctuation by default', () => {
    expect(isPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE)).toBe(true);
  });

  it('switches every punctuation family off together', () => {
    const profile = withPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, false);

    for (const family of PUNCTUATION_RULE_FAMILIES) {
      expect(profile[family]).toBe(false);
    }
    expect(isPunctuationChecked(profile)).toBe(false);
  });

  it('switches them all back on together', () => {
    const off = withPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, false);

    expect(isPunctuationChecked(withPunctuationChecked(off, true))).toBe(true);
  });

  it('leaves the agreement and conjugation families alone', () => {
    const profile = withPunctuationChecked(DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, false);

    expect(profile.gn).toBe(true);
    expect(profile.ppas).toBe(true);
    expect(profile.conj).toBe(true);
  });

  it('reads a half-switched profile as punctuation off', () => {
    // Nothing enforces the families move together in an already-stored profile;
    // the option is only "on" when the engine would actually report on all of them.
    const half = { ...DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, virg: false };

    expect(isPunctuationChecked(half)).toBe(false);
  });

  it('does not mutate the profile it is given', () => {
    const profile = { ...DEFAULT_FICTION_GRAMMAR_RULE_PROFILE };

    withPunctuationChecked(profile, false);

    expect(profile.virg).toBe(true);
  });
});
