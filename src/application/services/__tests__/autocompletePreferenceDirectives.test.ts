// ABOUTME: Unit tests for length/audace prompt directives
// ABOUTME: Verifies defaults stay empty and non-defaults inject a labelled block

import { describe, it, expect } from 'vitest';
import {
  lengthDirective,
  audaceDirective,
} from '../autocompletePreferenceDirectives';

describe('lengthDirective', () => {
  it('returns empty for the default medium length', () => {
    expect(lengthDirective('medium')).toBe('');
  });

  it('returns empty when length is undefined', () => {
    expect(lengthDirective(undefined)).toBe('');
  });

  it('injects a labelled block for short', () => {
    const out = lengthDirective('short');
    expect(out).toContain('[LONGUEUR DEMANDÉE]');
    expect(out).toContain('courte');
  });

  it('injects a labelled block for long', () => {
    const out = lengthDirective('long');
    expect(out).toContain('[LONGUEUR DEMANDÉE]');
  });
});

describe('audaceDirective', () => {
  it('returns empty for the default balanced level', () => {
    expect(audaceDirective('balanced')).toBe('');
  });

  it('returns empty when audace is undefined', () => {
    expect(audaceDirective(undefined)).toBe('');
  });

  it('injects a labelled block for prudent', () => {
    const out = audaceDirective('prudent');
    expect(out).toContain('[AUDACE DEMANDÉE]');
    expect(out).toContain('sobre');
  });

  it('injects a labelled block for bold', () => {
    const out = audaceDirective('bold');
    expect(out).toContain('[AUDACE DEMANDÉE]');
  });
});
