// ABOUTME: Applies the automatic snapshot clock and retention policy on the server.
// ABOUTME: The browser may heartbeat from many sessions; this use case creates at most one due snapshot.

import { Snapshot, type SnapshotEditorialMetadata } from '@/domain/entities/Snapshot';
import type { AutomaticSnapshotRepository } from '@/domain/interfaces/AutomaticSnapshotRepository';
import type { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';
import type { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { automaticSnapshotsToPrune } from '@/domain/services/AutomaticSnapshotRetention';

export interface ProcessAutomaticSnapshotInput {
  ownerId: string;
  projectId: string;
  sessionId: string;
  timeZone: string;
  now?: Date;
}

export interface ProcessAutomaticSnapshotResult {
  created: boolean;
  error?: string;
  prunedCount: number;
}

function editorialMetadata(settings: ProjectSettings | null): SnapshotEditorialMetadata | null {
  if (!settings) return null;
  return {
    title: settings.getTitle(), subtitle: settings.getSubtitle(), summary: settings.getSummary(),
    coverImageUrl: settings.getCoverImageUrl(), genre: settings.getGenre(), synopsis: settings.getSynopsis(),
    pointOfView: settings.getPointOfView(), tense: settings.getTense(), targetAudience: settings.getTargetAudience(),
    isbn: settings.getIsbn(), contributors: settings.getContributors(), relatedWorks: settings.getRelatedWorks(),
  };
}

export class ProcessAutomaticSnapshotUseCase {
  constructor(
    private readonly automaticSnapshots: AutomaticSnapshotRepository,
    private readonly snapshots: SnapshotRepository,
    private readonly projects: ProjectRepository,
    private readonly settings: ProjectSettingsRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: ProcessAutomaticSnapshotInput): Promise<ProcessAutomaticSnapshotResult> {
    const now = input.now ?? new Date();
    await this.automaticSnapshots.heartbeat(input.ownerId, input.projectId, input.sessionId, now);
    const schedule = await this.automaticSnapshots.claimDueSnapshot(input.ownerId, input.projectId, now);
    if (!schedule || !schedule.intervalMinutes) return { created: false, prunedCount: 0 };
    if (!(await this.automaticSnapshots.hasOpenSession(input.ownerId, input.projectId, now))) {
      await this.automaticSnapshots.releaseFailedSnapshot(input.ownerId, input.projectId, now);
      return { created: false, prunedCount: 0 };
    }

    try {
      const project = await this.projects.loadProject(input.ownerId, input.projectId);
      if (!project) throw new Error('Project not found');
      const projectSettings = await this.settings.findByProjectId(input.ownerId, input.projectId);
      const snapshot = new Snapshot({
        id: this.ids.generate(), projectId: input.projectId, ownerId: input.ownerId, authorId: input.ownerId,
        number: await this.snapshots.getNextSequenceNumber(input.ownerId, input.projectId), type: 'automatic',
        title: 'Snapshot automatique', comment: null, projectTitle: project.getTitle(),
        chapters: project.getChapters().map((chapter) => ({
          id: chapter.getId(), title: chapter.getTitle(), content: chapter.getContent(), order: chapter.getOrder(),
        })),
        editorialMetadata: editorialMetadata(projectSettings), createdAt: now,
      });
      await this.snapshots.save(input.ownerId, snapshot);
      await this.automaticSnapshots.completeSnapshot(
        input.ownerId,
        input.projectId,
        schedule.changeRevision,
        now,
      );
      const prunable = automaticSnapshotsToPrune(
        await this.snapshots.findByProjectId(input.ownerId, input.projectId), now, projectSettings?.getSnapshotTimeZone() ?? input.timeZone,
      );
      const prunedCount = this.snapshots.deleteByIds
        ? await this.snapshots.deleteByIds(input.ownerId, prunable)
        : 0;
      await this.automaticSnapshots.recordPruningActivity(input.ownerId, input.projectId, prunedCount, now);
      return { created: true, prunedCount };
    } catch (error) {
      await this.automaticSnapshots.releaseFailedSnapshot(input.ownerId, input.projectId, now);
      const message = error instanceof Error ? error.message : 'Échec du snapshot automatique';
      throw new Error(`Automatic snapshot failed: ${message}`);
    }
  }
}
