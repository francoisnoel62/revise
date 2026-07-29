// ABOUTME: MongoDB implementation of the automatic snapshot server clock.
// ABOUTME: Uses an atomic lease so concurrent editor sessions cannot create duplicate snapshots.

import type { Collection, Db } from 'mongodb';
import type { AutomaticSnapshotRepository, AutomaticSnapshotSchedule } from '@/domain/interfaces/AutomaticSnapshotRepository';
import type { AutomaticSnapshotInterval } from '@/domain/value-objects/AutomaticSnapshotInterval';
import { AUTOMATIC_SNAPSHOT_INTERVALS } from '@/domain/value-objects/AutomaticSnapshotInterval';

const SCHEDULES = 'automaticSnapshotSchedules';
const SESSIONS = 'automaticSnapshotSessions';
const ACTIVITY = 'automaticSnapshotActivity';
const SESSION_TTL_MS = 90_000;
const LEASE_MS = 60_000;

interface ScheduleDocument extends AutomaticSnapshotSchedule {
  _id: string;
  leaseUntil: Date | null;
}

interface SessionDocument {
  _id: string;
  ownerId: string;
  projectId: string;
  expiresAt: Date;
}

interface PruningActivityDocument {
  ownerId: string;
  projectId: string;
  type: 'automatic-snapshots-pruned';
  count: number;
  createdAt: Date;
}

export class MongoDBAutomaticSnapshotRepository implements AutomaticSnapshotRepository {
  constructor(private readonly db: Db) {}

  private schedules(): Collection<ScheduleDocument> {
    return this.db.collection<ScheduleDocument>(SCHEDULES);
  }

  private sessions(): Collection<SessionDocument> {
    return this.db.collection<SessionDocument>(SESSIONS);
  }

  async ensureIndexes(): Promise<void> {
    await Promise.all([
      this.schedules().createIndex({ ownerId: 1, projectId: 1 }, { unique: true }),
      this.sessions().createIndex({ ownerId: 1, projectId: 1, expiresAt: 1 }),
      this.sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.db.collection<PruningActivityDocument>(ACTIVITY).createIndex({ ownerId: 1, projectId: 1, createdAt: -1 }),
    ]);
  }

  async configure(ownerId: string, projectId: string, intervalMinutes: AutomaticSnapshotInterval | null): Promise<void> {
    await this.schedules().updateOne(
      { _id: `${ownerId}:${projectId}` },
      {
        $set: {
          ownerId,
          projectId,
          intervalMinutes,
          changedAt: null,
          nextDueAt: null,
          changeRevision: 0,
          leaseUntil: null,
        },
      },
      { upsert: true },
    );
  }

  async recordSavedChange(ownerId: string, projectId: string, now: Date): Promise<void> {
    const schedule = await this.schedules().findOne({ _id: `${ownerId}:${projectId}` });
    if (!schedule?.intervalMinutes) return;
    const result = await this.schedules().updateOne(
      { _id: schedule._id, changedAt: null },
      { $set: { changedAt: now, nextDueAt: new Date(now.getTime() + schedule.intervalMinutes * 60_000) }, $inc: { changeRevision: 1 } },
    );
    if (result.matchedCount === 0) {
      // Keep the original deadline: later autosaves make the project newer but must not
      // starve a due snapshot. The revision protects a concurrent creation from clearing it.
      await this.schedules().updateOne(
        { _id: schedule._id },
        { $set: { changedAt: now }, $inc: { changeRevision: 1 } },
      );
    }
  }

  async heartbeat(ownerId: string, projectId: string, sessionId: string, now: Date): Promise<void> {
    await this.sessions().updateOne(
      { _id: `${ownerId}:${projectId}:${sessionId}` },
      { $set: { ownerId, projectId, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) } },
      { upsert: true },
    );
  }

  async claimDueSnapshot(ownerId: string, projectId: string, now: Date): Promise<AutomaticSnapshotSchedule | null> {
    const schedule = await this.schedules().findOneAndUpdate(
      {
        _id: `${ownerId}:${projectId}`,
        intervalMinutes: { $in: [...AUTOMATIC_SNAPSHOT_INTERVALS] },
        changedAt: { $ne: null },
        nextDueAt: { $lte: now },
        $or: [{ leaseUntil: null }, { leaseUntil: { $lte: now } }],
      },
      { $set: { leaseUntil: new Date(now.getTime() + LEASE_MS) } },
      { returnDocument: 'after' },
    );
    if (!schedule) return null;
    return {
      ownerId: schedule.ownerId,
      projectId: schedule.projectId,
      intervalMinutes: schedule.intervalMinutes,
      changedAt: schedule.changedAt,
      nextDueAt: schedule.nextDueAt,
      changeRevision: schedule.changeRevision,
    };
  }

  async hasOpenSession(ownerId: string, projectId: string, now: Date): Promise<boolean> {
    return (await this.sessions().countDocuments({ ownerId, projectId, expiresAt: { $gt: now } }, { limit: 1 })) > 0;
  }

  async completeSnapshot(ownerId: string, projectId: string, claimedChangeRevision: number | null, now: Date): Promise<void> {
    const schedule = await this.schedules().findOne({ _id: `${ownerId}:${projectId}` });
    if (!schedule?.intervalMinutes) return;
    const completed = await this.schedules().updateOne(
      claimedChangeRevision === null
        ? { _id: schedule._id }
        : { _id: schedule._id, changeRevision: claimedChangeRevision },
      {
        $set: {
          changedAt: null,
          nextDueAt: new Date(now.getTime() + schedule.intervalMinutes * 60_000),
          leaseUntil: null,
        },
      },
    );
    if (completed.matchedCount === 0) {
      // A saved change raced the snapshot. Preserve it, but give it a fresh full interval
      // from this snapshot creation before it can produce the next automatic version.
      await this.schedules().updateOne(
        { _id: schedule._id },
        { $set: { nextDueAt: new Date(now.getTime() + schedule.intervalMinutes * 60_000), leaseUntil: null } },
      );
    }
  }

  async releaseFailedSnapshot(ownerId: string, projectId: string, now: Date): Promise<void> {
    const schedule = await this.schedules().findOne({ _id: `${ownerId}:${projectId}` });
    if (!schedule?.intervalMinutes) return;
    await this.schedules().updateOne(
      { _id: schedule._id },
      { $set: { nextDueAt: new Date(now.getTime() + schedule.intervalMinutes * 60_000), leaseUntil: null } },
    );
  }

  async recordPruningActivity(ownerId: string, projectId: string, prunedCount: number, now: Date): Promise<void> {
    if (prunedCount === 0) return;
    await this.db.collection<PruningActivityDocument>(ACTIVITY).insertOne({
      ownerId, projectId, type: 'automatic-snapshots-pruned', count: prunedCount, createdAt: now,
    });
  }
}
