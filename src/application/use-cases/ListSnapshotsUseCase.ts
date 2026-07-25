// ABOUTME: Use case for listing a project's snapshot history
// ABOUTME: Also reports whether the current state differs from the latest snapshot

import { Snapshot } from '../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../domain/interfaces/ProjectSettingsRepository';

export interface ListSnapshotsInput {
  ownerId: string;
  projectId: string;
}

export interface ListSnapshotsResult {
  snapshots: Snapshot[];
  hasUnsnapshottedChanges: boolean;
}

function latestOf(snapshots: Snapshot[]): Snapshot | null {
  return snapshots.reduce<Snapshot | null>(
    (max, snapshot) => (!max || snapshot.getNumber() > max.getNumber() ? snapshot : max),
    null
  );
}

export class ListSnapshotsUseCase {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository
  ) {}

  async execute(input: ListSnapshotsInput): Promise<ListSnapshotsResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const [snapshots, settings] = await Promise.all([
      this.snapshotRepository.findByProjectId(input.ownerId, input.projectId),
      this.projectSettingsRepository.findByProjectId(input.ownerId, input.projectId),
    ]);

    const latest = latestOf(snapshots);
    const lastChangeAt = settings && settings.getUpdatedAt() > project.getUpdatedAt()
      ? settings.getUpdatedAt()
      : project.getUpdatedAt();

    const hasUnsnapshottedChanges =
      !latest || lastChangeAt.getTime() > latest.getCreatedAt().getTime();

    return { snapshots, hasUnsnapshottedChanges };
  }
}
