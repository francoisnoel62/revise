// ABOUTME: Value object defining the provenance of a project snapshot
// ABOUTME: Manual snapshots are author-triggered; the rest are reserved for later tickets

export const SNAPSHOT_TYPES = ['manual', 'automatic', 'restore', 'safety'] as const;

export type SnapshotType = (typeof SNAPSHOT_TYPES)[number];

export function isValidSnapshotType(value: string): value is SnapshotType {
  return SNAPSHOT_TYPES.includes(value as SnapshotType);
}
