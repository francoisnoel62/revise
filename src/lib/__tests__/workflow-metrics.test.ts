// ABOUTME: Tests for pure workflow-metrics helpers
// ABOUTME: Week boundaries, averages, required pace, completion projection, and streak

import { describe, it, expect } from 'vitest';
import {
  getWeekStartLocalDate,
  previousLocalDate,
  averageWrittenPerDay,
  requiredDailyPace,
  projectCompletionDate,
  currentDailyStreak,
} from '../workflow-metrics';

describe('getWeekStartLocalDate', () => {
  it('returns the Monday of the week for a Sunday', () => {
    // 2026-05-31 is a Sunday
    expect(getWeekStartLocalDate('2026-05-31')).toBe('2026-05-25');
  });

  it('returns the same date when it is already Monday', () => {
    expect(getWeekStartLocalDate('2026-05-25')).toBe('2026-05-25');
  });

  it('returns the Monday for a midweek day', () => {
    // 2026-05-29 is a Friday
    expect(getWeekStartLocalDate('2026-05-29')).toBe('2026-05-25');
  });
});

describe('previousLocalDate', () => {
  it('returns the previous day', () => {
    expect(previousLocalDate('2026-06-01')).toBe('2026-05-31');
  });

  it('handles month boundaries', () => {
    expect(previousLocalDate('2026-03-01')).toBe('2026-02-28');
  });
});

describe('averageWrittenPerDay', () => {
  it('averages over days that have a written value, ignoring nulls', () => {
    const points = [
      { written: null },
      { written: 1200 },
      { written: -300 },
      { written: 1500 },
    ];
    expect(averageWrittenPerDay(points)).toBe(800);
  });

  it('returns 0 when there are no measurable days', () => {
    expect(averageWrittenPerDay([{ written: null }])).toBe(0);
    expect(averageWrittenPerDay([])).toBe(0);
  });
});

describe('requiredDailyPace', () => {
  it('divides remaining words over remaining days', () => {
    expect(requiredDailyPace(3000, 10)).toBe(300);
  });

  it('rounds up to a whole number of words', () => {
    expect(requiredDailyPace(1000, 3)).toBe(334);
  });

  it('returns null when there are no days left', () => {
    expect(requiredDailyPace(3000, 0)).toBeNull();
    expect(requiredDailyPace(3000, -2)).toBeNull();
  });
});

describe('projectCompletionDate', () => {
  it('projects the finish date from the average pace', () => {
    expect(projectCompletionDate(3000, 1000, '2026-05-31')).toBe('2026-06-03');
  });

  it('returns the starting day when nothing remains', () => {
    expect(projectCompletionDate(0, 1000, '2026-05-31')).toBe('2026-05-31');
  });

  it('returns null when the pace is not positive', () => {
    expect(projectCompletionDate(3000, 0, '2026-05-31')).toBeNull();
    expect(projectCompletionDate(3000, -50, '2026-05-31')).toBeNull();
  });
});

describe('currentDailyStreak', () => {
  it('counts consecutive most-recent days meeting the target', () => {
    const points = [
      { localDate: '2026-05-29', written: 1500 },
      { localDate: '2026-05-30', written: 1500 },
      { localDate: '2026-05-31', written: 1500 },
    ];
    expect(currentDailyStreak(points, 1000)).toBe(3);
  });

  it('breaks the streak on a day below target', () => {
    const points = [
      { localDate: '2026-05-29', written: 1500 },
      { localDate: '2026-05-30', written: 200 },
      { localDate: '2026-05-31', written: 1500 },
    ];
    expect(currentDailyStreak(points, 1000)).toBe(1);
  });

  it('breaks the streak on a calendar gap', () => {
    const points = [
      { localDate: '2026-05-28', written: 1500 },
      { localDate: '2026-05-30', written: 1500 },
      { localDate: '2026-05-31', written: 1500 },
    ];
    expect(currentDailyStreak(points, 1000)).toBe(2);
  });

  it('returns 0 when the most recent day misses the target', () => {
    const points = [{ localDate: '2026-05-31', written: 500 }];
    expect(currentDailyStreak(points, 1000)).toBe(0);
  });
});
