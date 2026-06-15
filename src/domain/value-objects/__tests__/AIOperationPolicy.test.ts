// ABOUTME: Tests for the AUTOCOMPLETE_POLICY value object
// ABOUTME: Locks the low-latency invariants relied on by the providers

import { describe, it, expect } from 'vitest';
import { AUTOCOMPLETE_POLICY } from '../AIOperationPolicy';

describe('AUTOCOMPLETE_POLICY', () => {
  it('targets the autocomplete operation in realtime with reasoning off', () => {
    expect(AUTOCOMPLETE_POLICY.operation).toBe('autocomplete');
    expect(AUTOCOMPLETE_POLICY.reasoning).toBe('off');
    expect(AUTOCOMPLETE_POLICY.latencyClass).toBe('realtime');
  });

  it('keeps a tiny output budget and a low temperature', () => {
    expect(AUTOCOMPLETE_POLICY.outputBudgetTokens).toBe(256);
    expect(AUTOCOMPLETE_POLICY.temperature).toBeGreaterThan(0);
    expect(AUTOCOMPLETE_POLICY.temperature).toBeLessThanOrEqual(0.4);
  });
});
