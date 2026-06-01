// ABOUTME: Pure helpers for writing workflow metrics (pace, projection, streak, week boundaries)
// ABOUTME: Operate on author-local date strings (YYYY-MM-DD) and per-day written deltas

function toUtcDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toLocalDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Return the Monday (ISO week start) of the week containing the given local date.
 */
export function getWeekStartLocalDate(localDate: string): string {
  const date = toUtcDate(localDate);
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const offsetToMonday = (dayOfWeek + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offsetToMonday);
  return toLocalDateString(date);
}

/**
 * Return the calendar day before the given local date.
 */
export function previousLocalDate(localDate: string): string {
  const date = toUtcDate(localDate);
  date.setUTCDate(date.getUTCDate() - 1);
  return toLocalDateString(date);
}

/**
 * Average words written per measured day. Days with no written value (null) are
 * ignored; negative days (revisions) are included so the average reflects net pace.
 */
export function averageWrittenPerDay(points: { written: number | null }[]): number {
  const measured = points.filter(
    (p): p is { written: number } => p.written !== null
  );
  if (measured.length === 0) return 0;
  const total = measured.reduce((sum, p) => sum + p.written, 0);
  return total / measured.length;
}

/**
 * Words per day needed to reach the milestone by its deadline.
 * Returns null when there are no days left.
 */
export function requiredDailyPace(
  remainingWords: number,
  daysRemaining: number
): number | null {
  if (daysRemaining <= 0) return null;
  return Math.ceil(remainingWords / daysRemaining);
}

/**
 * Projected completion date given the recent average pace, starting from a local date.
 * Returns the start date when nothing remains, and null when the pace is not positive.
 */
export function projectCompletionDate(
  remainingWords: number,
  averagePerDay: number,
  fromLocalDate: string
): string | null {
  if (remainingWords <= 0) return fromLocalDate;
  if (averagePerDay <= 0) return null;

  const daysNeeded = Math.ceil(remainingWords / averagePerDay);
  const date = toUtcDate(fromLocalDate);
  date.setUTCDate(date.getUTCDate() + daysNeeded);
  return toLocalDateString(date);
}

/**
 * Number of consecutive most-recent days that met the daily target.
 * The streak breaks on a day below target or on a calendar gap between days.
 * Expects points sorted by localDate ascending.
 */
export function currentDailyStreak(
  points: { localDate: string; written: number | null }[],
  target: number
): number {
  let streak = 0;
  let expectedDate: string | null = null;

  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];

    if (expectedDate !== null && point.localDate !== expectedDate) break;
    if (point.written === null || point.written < target) break;

    streak++;
    expectedDate = previousLocalDate(point.localDate);
  }

  return streak;
}
