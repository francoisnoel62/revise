// ABOUTME: Tests for the intent → directive mapping used by the completion route
// ABOUTME: Natural is empty; other intents produce a labeled directive

import { describe, it, expect } from 'vitest';
import { intentDirective } from '../autocompleteIntents';
import { AUTOCOMPLETE_INTENTS } from '@/domain/value-objects/AutocompleteIntent';

describe('intentDirective', () => {
  it('returns an empty string for the natural intent', () => {
    expect(intentDirective('natural')).toBe('');
  });

  it('returns a labeled directive for non-natural intents', () => {
    for (const intent of AUTOCOMPLETE_INTENTS) {
      if (intent === 'natural') continue;
      const directive = intentDirective(intent);
      expect(directive).toContain('[INTENTION DEMANDÉE]');
      expect(directive.trim().length).toBeGreaterThan(0);
    }
  });
});
