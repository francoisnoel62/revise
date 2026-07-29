// ABOUTME: Pure retention policy for automatic project snapshots.
// ABOUTME: Keeps durable snapshot types untouched and groups automatic versions in the project's timezone.

import { Snapshot } from '@/domain/entities/Snapshot';

function localDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function localWeek(date: Date, timeZone: string): string {
  const [month, day, year] = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date).split('/').map(Number);
  const local = new Date(Date.UTC(year, month - 1, day));
  local.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7));
  return local.toISOString().slice(0, 10);
}

/** Keeps the 20 latest, then one/day for 30 days and one/week for six months. */
export function automaticSnapshotsToPrune(snapshots: Snapshot[], now: Date, timeZone: string): string[] {
  const automatic = snapshots.filter((snapshot) => snapshot.getType() === 'automatic')
    .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());
  const keep = new Set(automatic.slice(0, 20).map((snapshot) => snapshot.getId()));
  const dailyCutoff = new Date(now); dailyCutoff.setUTCDate(dailyCutoff.getUTCDate() - 30);
  const weeklyCutoff = new Date(now); weeklyCutoff.setUTCMonth(weeklyCutoff.getUTCMonth() - 6);
  const days = new Set<string>();
  const weeks = new Set<string>();
  for (const snapshot of automatic.slice(20)) {
    const createdAt = snapshot.getCreatedAt();
    if (createdAt >= dailyCutoff) {
      const key = localDay(createdAt, timeZone);
      if (!days.has(key)) { days.add(key); keep.add(snapshot.getId()); }
    } else if (createdAt >= weeklyCutoff) {
      const key = localWeek(createdAt, timeZone);
      if (!weeks.has(key)) { weeks.add(key); keep.add(snapshot.getId()); }
    }
  }
  return automatic.filter((snapshot) => !keep.has(snapshot.getId())).map((snapshot) => snapshot.getId());
}
