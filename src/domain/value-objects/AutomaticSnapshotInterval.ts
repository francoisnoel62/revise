// ABOUTME: Allowed automatic project snapshot frequencies.
// ABOUTME: Keeps the persisted project setting and scheduler contract aligned.

export const AUTOMATIC_SNAPSHOT_INTERVALS = [5, 15, 30, 60] as const;

export type AutomaticSnapshotInterval = (typeof AUTOMATIC_SNAPSHOT_INTERVALS)[number];

export function isAutomaticSnapshotInterval(
  value: number | null | undefined,
): value is AutomaticSnapshotInterval {
  return value !== null && value !== undefined && AUTOMATIC_SNAPSHOT_INTERVALS.includes(value as AutomaticSnapshotInterval);
}
