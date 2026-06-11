// ABOUTME: Tests for exchange content truncation (caps bulky manuscript payloads before storage)
// ABOUTME: Verifies byte-bounded truncation with a marker and pass-through of small content

import { describe, it, expect } from 'vitest';
import {
  truncateExchangeField,
  MAX_EXCHANGE_FIELD_BYTES,
} from '../exchange-truncation';

describe('truncateExchangeField', () => {
  it('returns short content unchanged', () => {
    expect(truncateExchangeField('hello')).toBe('hello');
  });

  it('truncates content exceeding the byte cap and appends a marker', () => {
    const huge = 'a'.repeat(MAX_EXCHANGE_FIELD_BYTES + 1000);

    const result = truncateExchangeField(huge);

    expect(result.length).toBeLessThan(huge.length);
    expect(result).toContain('[contenu tronqué]');
    expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(
      MAX_EXCHANGE_FIELD_BYTES + Buffer.byteLength('\n\n…[contenu tronqué]', 'utf8')
    );
  });

  it('respects a custom cap', () => {
    const result = truncateExchangeField('abcdefghij', 5);
    expect(result.startsWith('abcde')).toBe(true);
    expect(result).toContain('[contenu tronqué]');
  });
});
