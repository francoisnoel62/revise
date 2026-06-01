// ABOUTME: Resolves an instant to the author-local calendar day (YYYY-MM-DD)
// ABOUTME: Used so daily/weekly writing activity is keyed on the author's own day

/**
 * Return the calendar day (YYYY-MM-DD) that the given instant falls on within
 * the provided IANA time zone. Falls back to the UTC day when the time zone
 * is not recognised.
 */
export function resolveLocalDate(date: Date, timeZone: string): string {
  try {
    // en-CA formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
