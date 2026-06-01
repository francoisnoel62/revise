// ABOUTME: Tests for resolveLocalDate
// ABOUTME: Verifies an instant maps to the correct author-local calendar day

import { describe, it, expect } from 'vitest';
import { resolveLocalDate } from '../local-date';

describe('resolveLocalDate', () => {
  it('returns the UTC day for the UTC time zone', () => {
    expect(resolveLocalDate(new Date('2026-06-01T02:30:00.000Z'), 'UTC')).toBe(
      '2026-06-01'
    );
  });

  it('rolls back to the previous local day for a western time zone past midnight UTC', () => {
    // 02:30 UTC on June 1 is still 22:30 May 31 in New York
    expect(
      resolveLocalDate(new Date('2026-06-01T02:30:00.000Z'), 'America/New_York')
    ).toBe('2026-05-31');
  });

  it('keeps the same local day before midnight UTC for a western time zone', () => {
    expect(
      resolveLocalDate(new Date('2026-05-31T23:30:00.000Z'), 'America/New_York')
    ).toBe('2026-05-31');
  });

  it('rolls forward for an eastern time zone ahead of UTC', () => {
    // 20:00 UTC May 31 is 09:00 June 1 in Auckland (UTC+12/13)
    expect(
      resolveLocalDate(new Date('2026-05-31T20:00:00.000Z'), 'Pacific/Auckland')
    ).toBe('2026-06-01');
  });

  it('falls back to the UTC day when the time zone is invalid', () => {
    expect(
      resolveLocalDate(new Date('2026-06-01T02:30:00.000Z'), 'Not/AZone')
    ).toBe('2026-06-01');
  });
});
