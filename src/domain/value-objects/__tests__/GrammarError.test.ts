// ABOUTME: Tests grammar error value objects returned by the grammar-checker port.
// ABOUTME: Guards ranges and rule-family metadata independently from an engine.

import { describe, expect, it } from 'vitest';
import {
  GrammarError,
  GrammarErrorRange,
  GrammarRuleFamily,
} from '../GrammarError';

describe('GrammarError value objects', () => {
  it('keeps the engine error metadata in an immutable domain shape', () => {
    const error = new GrammarError({
      range: new GrammarErrorRange(4, 9),
      message: 'Accord de nombre erroné.',
      suggestions: ['chiens'],
      ruleFamily: new GrammarRuleFamily('gn'),
      ruleId: 'g3__gn_les_1m__b3_a1_1',
    });

    expect(error.range).toEqual(new GrammarErrorRange(4, 9));
    expect(error.suggestions).toEqual(['chiens']);
    expect(error.ruleFamily.value).toBe('gn');
    expect(error.ruleId).toBe('g3__gn_les_1m__b3_a1_1');
  });

  it('rejects invalid positions and an empty rule family', () => {
    expect(() => new GrammarErrorRange(-1, 2)).toThrow('non-negative');
    expect(() => new GrammarErrorRange(4, 3)).toThrow('greater than or equal');
    expect(() => new GrammarRuleFamily('  ')).toThrow('cannot be empty');
  });
});
