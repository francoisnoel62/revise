// ABOUTME: Persistence contract for the server-side automatic snapshot clock.
// ABOUTME: Coordinates open editor sessions, saved changes, and one global due time per project.

import type { AutomaticSnapshotInterval } from '@/domain/value-objects/AutomaticSnapshotInterval';

export interface AutomaticSnapshotSchedule {
  ownerId: string;
  projectId: string;
  intervalMinutes: AutomaticSnapshotInterval | null;
  changedAt: Date | null;
  nextDueAt: Date | null;
  changeRevision: number;
}

export interface AutomaticSnapshotRepository {
  configure(ownerId: string, projectId: string, intervalMinutes: AutomaticSnapshotInterval | null): Promise<void>;
  recordSavedChange(ownerId: string, projectId: string, now: Date): Promise<void>;
  heartbeat(ownerId: string, projectId: string, sessionId: string, now: Date): Promise<void>;
  claimDueSnapshot(ownerId: string, projectId: string, now: Date): Promise<AutomaticSnapshotSchedule | null>;
  hasOpenSession(ownerId: string, projectId: string, now: Date): Promise<boolean>;
  completeSnapshot(ownerId: string, projectId: string, claimedChangeRevision: number | null, now: Date): Promise<void>;
  releaseFailedSnapshot(ownerId: string, projectId: string, now: Date): Promise<void>;
  recordPruningActivity(ownerId: string, projectId: string, prunedCount: number, now: Date): Promise<void>;
}
