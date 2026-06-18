// ABOUTME: Unit tests for the shared canon-facts request builder and JSON parser
// ABOUTME: Verifies cast injection, valid-fact filtering, and shape validation

import { describe, it, expect } from 'vitest';
import {
  buildCanonFactsUserMessage,
  parseCanonFactsJson,
} from '../canon-facts-parsing';

describe('buildCanonFactsUserMessage', () => {
  it('prepends the known cast to the manuscript', () => {
    const msg = buildCanonFactsUserMessage('# Ch1\n\nTexte', ['Léa', 'Tom']);
    expect(msg).toContain('PERSONNAGES CONNUS: Léa, Tom');
    expect(msg).toContain('# Ch1');
  });

  it('handles an empty cast', () => {
    expect(buildCanonFactsUserMessage('texte', [])).toContain('(aucun)');
  });
});

describe('parseCanonFactsJson', () => {
  it('parses a valid payload and trims fields', () => {
    const result = parseCanonFactsJson(
      JSON.stringify({
        facts: [
          { entity: ' Léa ', statement: ' est morte ', validFromChapter: 9, evidence: 'q' },
        ],
      })
    );
    expect(result.facts).toEqual([
      { entity: 'Léa', statement: 'est morte', validFromChapter: 9, evidence: 'q' },
    ]);
  });

  it('drops malformed facts but keeps valid ones', () => {
    const result = parseCanonFactsJson(
      JSON.stringify({
        facts: [
          { entity: 'Léa', statement: 'est morte', validFromChapter: 9, evidence: 'q' },
          { entity: '', statement: 'x', validFromChapter: 0, evidence: 'q' },
          { entity: 'Tom', statement: 'x', validFromChapter: -1, evidence: 'q' },
        ],
      })
    );
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].entity).toBe('Léa');
  });

  it('returns an empty list when no facts', () => {
    expect(parseCanonFactsJson(JSON.stringify({ facts: [] })).facts).toEqual([]);
  });

  it('throws on invalid shape', () => {
    expect(() => parseCanonFactsJson('not json')).toThrow();
    expect(() => parseCanonFactsJson(JSON.stringify({ nope: true }))).toThrow();
  });

  it('passes through a non-empty invalidates field', () => {
    const result = parseCanonFactsJson(
      JSON.stringify({
        facts: [
          {
            entity: 'Léa',
            statement: 'sait que Tom est innocent',
            validFromChapter: 5,
            evidence: 'q',
            invalidates: 'croit que Tom est coupable',
          },
        ],
      })
    );
    expect(result.facts[0].invalidates).toBe('croit que Tom est coupable');
  });

  it('omits invalidates when absent or empty', () => {
    const result = parseCanonFactsJson(
      JSON.stringify({
        facts: [
          { entity: 'Léa', statement: 'est morte', validFromChapter: 9, evidence: 'q' },
        ],
      })
    );
    expect(result.facts[0].invalidates).toBeUndefined();
  });
});
