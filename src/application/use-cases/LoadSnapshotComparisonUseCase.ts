// ABOUTME: Loads a past snapshot beside one immutable, server-persisted current project state.
// ABOUTME: This is read-only preparation for a comparison; it never saves or restores anything.

import { Snapshot, type SnapshotChapter, type SnapshotEditorialMetadata } from '@/domain/entities/Snapshot';
import { type SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import { type ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { type ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { ProjectNotFoundError, SnapshotNotFoundError } from './RestoreSnapshotUseCase';
import { snapshotEditorialMetadataFrom } from '@/application/services/snapshot-editorial-metadata';

export interface LoadSnapshotComparisonInput {
  ownerId: string;
  projectId: string;
  snapshotId: string;
}

export interface PersistedCurrentSnapshotState {
  projectTitle: string;
  chapters: SnapshotChapter[];
  editorialMetadata: SnapshotEditorialMetadata | null;
}

export interface LoadSnapshotComparisonResult {
  snapshot: Snapshot;
  /** A server-side state frozen for this comparison request. */
  current: PersistedCurrentSnapshotState;
  /** Timestamp at which the server captured the current state. */
  comparedAt: Date;
}

export class LoadSnapshotComparisonUseCase {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
  ) {}

  async execute(input: LoadSnapshotComparisonInput): Promise<LoadSnapshotComparisonResult> {
    if (!input.ownerId?.trim()) throw new Error('Owner ID is required');
    if (!input.projectId?.trim()) throw new Error('Project ID is required');
    if (!input.snapshotId?.trim()) throw new Error('Snapshot ID is required');

    const snapshot = await this.snapshotRepository.findById(input.ownerId, input.snapshotId);
    if (!snapshot || snapshot.getProjectId() !== input.projectId) {
      throw new SnapshotNotFoundError(input.snapshotId);
    }

    // There is no cross-collection transaction in the deployed Mongo topology.
    // Reading the project on both sides of settings gives us a coherent point-in-time
    // pair: when its version stayed stable, both values existed together at the settings read.
    // A writer racing continuously receives an explicit retry prompt instead of a mixed state.
    let project = null;
    let settings = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const before = await this.projectRepository.loadProject(input.ownerId, input.projectId);
      if (!before) throw new ProjectNotFoundError(input.projectId);
      const candidateSettings = await this.projectSettingsRepository.findByProjectId(
        input.ownerId,
        input.projectId,
      );
      const after = await this.projectRepository.loadProject(input.ownerId, input.projectId);
      if (!after) throw new ProjectNotFoundError(input.projectId);
      if (before.getUpdatedAt().getTime() === after.getUpdatedAt().getTime()) {
        project = after;
        settings = candidateSettings;
        break;
      }
    }
    if (!project) {
      throw new Error('Le projet a été modifié pendant le chargement. Veuillez relancer la comparaison.');
    }

    return {
      snapshot,
      current: {
        projectTitle: project.getTitle(),
        chapters: project.getChapters().map((chapter) => ({
          id: chapter.getId(),
          title: chapter.getTitle(),
          content: chapter.getContent(),
          order: chapter.getOrder(),
        })),
        editorialMetadata: settings ? snapshotEditorialMetadataFrom(settings) : null,
      },
      comparedAt: new Date(),
    };
  }
}
