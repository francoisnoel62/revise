// ABOUTME: Tests applyFrenchSpacing — non-breaking spaces around French high punctuation.
// ABOUTME: Guards that punctuation cannot orphan at a line start without mutating the text.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { applyFrenchSpacing } from './frenchSpacing';

const NBSP = String.fromCharCode(0xa0);

describe('applyFrenchSpacing', () => {
  it('makes the space before ; : ! ? non-breaking', () => {
    expect(applyFrenchSpacing('Vraiment ?')).toBe(`Vraiment${NBSP}?`);
    expect(applyFrenchSpacing('Quoi !')).toBe(`Quoi${NBSP}!`);
    expect(applyFrenchSpacing('Stop ; puis')).toBe(`Stop${NBSP}; puis`);
    expect(applyFrenchSpacing('Attention : ceci')).toBe(`Attention${NBSP}: ceci`);
  });

  it('makes the spaces inside guillemets non-breaking', () => {
    expect(applyFrenchSpacing('« Bonjour »')).toBe(`«${NBSP}Bonjour${NBSP}»`);
  });

  it('leaves text without French punctuation untouched', () => {
    expect(applyFrenchSpacing('Bonjour le monde.')).toBe('Bonjour le monde.');
  });

  it('does not insert a space where the author put none', () => {
    expect(applyFrenchSpacing('Quoi!')).toBe('Quoi!');
    expect(applyFrenchSpacing('«Bonjour»')).toBe('«Bonjour»');
  });
});
