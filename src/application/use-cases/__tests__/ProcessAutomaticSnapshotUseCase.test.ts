// ABOUTME: Behaviour tests for automatic snapshot creation, failure isolation, and retention.
// ABOUTME: Uses the application seam rather than inspecting scheduler implementation details.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessAutomaticSnapshotUseCase } from '../ProcessAutomaticSnapshotUseCase';
import { automaticSnapshotsToPrune } from '@/domain/services/AutomaticSnapshotRetention';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { Snapshot } from '@/domain/entities/Snapshot';

const ownerId = 'owner-1';
const projectId = 'project-1';
const now = new Date('2026-07-29T12:00:00Z');

function snapshot(number: number, createdAt: Date, type: 'automatic' | 'manual' = 'automatic'): Snapshot {
  return new Snapshot({
    id: `snapshot-${number}-${createdAt.getTime()}`, projectId, ownerId, authorId: ownerId, number, type,
    title: `Version ${number}`, comment: null, projectTitle: 'Roman',
    chapters: [{ id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 }],
    editorialMetadata: null, createdAt,
  });
}

describe('ProcessAutomaticSnapshotUseCase', () => {
  const automaticRepository = {
    heartbeat: vi.fn(), claimDueSnapshot: vi.fn(), hasOpenSession: vi.fn(), completeSnapshot: vi.fn(), releaseFailedSnapshot: vi.fn(), recordPruningActivity: vi.fn(),
  };
  const snapshotRepository = {
    getNextSequenceNumber: vi.fn(), save: vi.fn(), findByProjectId: vi.fn(), deleteByIds: vi.fn(),
  };
  const project = new Project(
    projectId, ownerId, 'Roman', [new Chapter('chapter-1', 'Chapitre 1', '{"type":"doc","content":[]}', 0)],
    'chapter-1', null, now, now,
  );
  const projects = { loadProject: vi.fn() };
  const settings = { findByProjectId: vi.fn() };
  const ids = { generate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    automaticRepository.claimDueSnapshot.mockResolvedValue({ ownerId, projectId, intervalMinutes: 5, changedAt: now, nextDueAt: now, changeRevision: 1 });
    automaticRepository.hasOpenSession.mockResolvedValue(true);
    snapshotRepository.getNextSequenceNumber.mockResolvedValue(1);
    snapshotRepository.findByProjectId.mockResolvedValue([]);
    snapshotRepository.deleteByIds.mockResolvedValue(0);
    projects.loadProject.mockResolvedValue(project);
    settings.findByProjectId.mockResolvedValue(ProjectSettings.create('settings-1', projectId, ownerId, 'Roman'));
    ids.generate.mockReturnValue('automatic-1');
  });

  it('captures one automatic snapshot only after the scheduler has claimed a due change', async () => {
    const useCase = new ProcessAutomaticSnapshotUseCase(
      automaticRepository as never, snapshotRepository as never, projects as never, settings as never, ids,
    );

    const result = await useCase.execute({ ownerId, projectId, sessionId: 'session-a', timeZone: 'Europe/Paris', now });

    expect(result).toEqual({ created: true, prunedCount: 0 });
    expect(snapshotRepository.save).toHaveBeenCalledWith(ownerId, expect.objectContaining({ getType: expect.any(Function) }));
    expect(snapshotRepository.save.mock.calls[0][1].getType()).toBe('automatic');
    expect(automaticRepository.completeSnapshot).toHaveBeenCalledWith(ownerId, projectId, 1, now);
  });

  it('releases the server clock for a later retry when snapshot creation fails', async () => {
    snapshotRepository.save.mockRejectedValue(new Error('Mongo indisponible'));
    const useCase = new ProcessAutomaticSnapshotUseCase(
      automaticRepository as never, snapshotRepository as never, projects as never, settings as never, ids,
    );

    await expect(useCase.execute({ ownerId, projectId, sessionId: 'session-a', timeZone: 'Europe/Paris', now }))
      .rejects.toThrow('Automatic snapshot failed: Mongo indisponible');
    expect(automaticRepository.releaseFailedSnapshot).toHaveBeenCalledWith(ownerId, projectId, now);
  });

  it('does not create a snapshot when no saved change has made the clock due', async () => {
    automaticRepository.claimDueSnapshot.mockResolvedValue(null);
    const useCase = new ProcessAutomaticSnapshotUseCase(
      automaticRepository as never, snapshotRepository as never, projects as never, settings as never, ids,
    );

    await expect(useCase.execute({ ownerId, projectId, sessionId: 'session-a', timeZone: 'Europe/Paris', now }))
      .resolves.toEqual({ created: false, prunedCount: 0 });
    expect(snapshotRepository.save).not.toHaveBeenCalled();
  });
});

describe('automaticSnapshotsToPrune', () => {
  it('preserves the 20 newest automatic snapshots and every manual snapshot', () => {
    const automatic = Array.from({ length: 22 }, (_, index) =>
      snapshot(index + 1, new Date(now.getTime() - index * 60_000)),
    );
    const manual = snapshot(99, new Date('2025-01-01T00:00:00Z'), 'manual');

    // #21 is retained as the newest snapshot of the same local day; #22 is redundant.
    expect(automaticSnapshotsToPrune([...automatic, manual], now, 'Europe/Paris')).toEqual([
      automatic[21].getId(),
    ]);
  });

  it('keeps the newest local daily and weekly representatives, pruning duplicates and expired snapshots', () => {
    const newest = Array.from({ length: 20 }, (_, index) => snapshot(index + 1, new Date(now.getTime() - index * 60_000)));
    const daily = snapshot(21, new Date('2026-07-01T10:00:00Z'));
    const sameDaily = snapshot(22, new Date('2026-07-01T08:00:00Z'));
    const weekly = snapshot(23, new Date('2026-06-03T10:00:00Z'));
    const sameWeekly = snapshot(24, new Date('2026-06-01T10:00:00Z'));
    const expired = snapshot(25, new Date('2025-12-01T10:00:00Z'));

    expect(automaticSnapshotsToPrune(
      [...newest, daily, sameDaily, weekly, sameWeekly, expired], now, 'Europe/Paris',
    )).toEqual([sameDaily.getId(), sameWeekly.getId(), expired.getId()]);
  });
});
