// ABOUTME: Use case for restoring a project to a past snapshot without losing history
// ABOUTME: Safety-snapshots unsnapshotted current work first, then applies the source content atomically

import { Project } from '../../domain/entities/Project';
import { Chapter } from '../../domain/entities/Chapter';
import { Snapshot, SnapshotEditorialMetadata } from '../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../domain/interfaces/ProjectSettingsRepository';
import { ProjectSettings } from '../../domain/entities/ProjectSettings';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { snapshotEditorialMetadataFrom } from '../services/snapshot-editorial-metadata';

export interface RestoreSnapshotInput {
  ownerId: string;
  projectId: string;
  /** The snapshot to restore from. */
  snapshotId: string;
  /** The project's updatedAt as last observed by the caller; detects concurrent modification. */
  expectedProjectUpdatedAt: Date;
}

export interface RestoreSnapshotResult {
  project: Project;
  restoreSnapshot: Snapshot;
  /** The pre-restore state saved before restoring, or null if it was already snapshotted. */
  safetySnapshot: Snapshot | null;
}

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

export class SnapshotNotFoundError extends Error {
  constructor(snapshotId: string) {
    super(`Snapshot not found: ${snapshotId}`);
    this.name = 'SnapshotNotFoundError';
  }
}

export class ConcurrentModificationError extends Error {
  constructor() {
    super('Le projet a été modifié entre-temps. Veuillez recharger avant de restaurer.');
    this.name = 'ConcurrentModificationError';
  }
}

function applyEditorialMetadata(
  settings: ProjectSettings,
  metadata: SnapshotEditorialMetadata
): ProjectSettings {
  return settings
    .updateTitle(metadata.title)
    .updateSubtitle(metadata.subtitle)
    .updateSummary(metadata.summary)
    .updateCoverImageUrl(metadata.coverImageUrl)
    .updateGenre(metadata.genre)
    .updateSynopsis(metadata.synopsis)
    .updatePointOfView(metadata.pointOfView)
    .updateTense(metadata.tense)
    .updateTargetAudience(metadata.targetAudience)
    .updateIsbn(metadata.isbn)
    .updateContributors(metadata.contributors)
    .updateRelatedWorks(metadata.relatedWorks);
}

export class RestoreSnapshotUseCase {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: RestoreSnapshotInput): Promise<RestoreSnapshotResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }
    if (!input.snapshotId || input.snapshotId.trim().length === 0) {
      throw new Error('Snapshot ID is required');
    }

    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    const source = await this.snapshotRepository.findById(input.ownerId, input.snapshotId);
    if (!source || source.getProjectId() !== input.projectId) {
      throw new SnapshotNotFoundError(input.snapshotId);
    }

    if (project.getUpdatedAt().getTime() !== input.expectedProjectUpdatedAt.getTime()) {
      throw new ConcurrentModificationError();
    }

    const currentSettings = await this.projectSettingsRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    const latest = await this.snapshotRepository.findLatestByProjectId(
      input.ownerId,
      input.projectId
    );
    const lastChangeAt =
      currentSettings && currentSettings.getUpdatedAt() > project.getUpdatedAt()
        ? currentSettings.getUpdatedAt()
        : project.getUpdatedAt();
    const hasUnsnapshottedChanges =
      !latest || lastChangeAt.getTime() > latest.getCreatedAt().getTime();

    const restoredChapters = source.getChapters().map(
      (chapter) => new Chapter(chapter.id, chapter.title, chapter.content, chapter.order)
    );
    const restoredChapterIds = restoredChapters.map((chapter) => chapter.getId());
    const activeChapterId = restoredChapterIds.includes(project.getActiveChapterId() ?? '')
      ? project.getActiveChapterId()
      : (restoredChapters[0]?.getId() ?? null);

    const restoredProject = new Project(
      project.getId(),
      input.ownerId,
      source.getProjectTitle(),
      restoredChapters,
      activeChapterId,
      project.getProviderId(),
      project.getCreatedAt(),
      new Date(),
      project.getIsPublished(),
      project.getShareToken(),
      project.getPublishedAt(),
      project.getPublishedChapterIds()
    );

    // The compare-and-swap is the atomicity gate for the concurrency-conflict
    // path: it must succeed before any snapshot number is allocated, so a lost
    // race never consumes a number or leaves a snapshot describing a
    // restoration that never actually happened.
    const succeeded = await this.projectRepository.replaceProjectIfUnchanged(
      input.ownerId,
      restoredProject,
      input.expectedProjectUpdatedAt
    );
    if (!succeeded) {
      throw new ConcurrentModificationError();
    }

    try {
      const sourceMetadata = source.getEditorialMetadata();
      if (sourceMetadata) {
        if (currentSettings) {
          await this.projectSettingsRepository.update(
            input.ownerId,
            applyEditorialMetadata(currentSettings, sourceMetadata)
          );
        } else {
          const newSettings = ProjectSettings.create(
            this.idGenerator.generate(),
            input.projectId,
            input.ownerId,
            sourceMetadata.title
          );
          await this.projectSettingsRepository.create(
            input.ownerId,
            applyEditorialMetadata(newSettings, sourceMetadata)
          );
        }
      }

      let safetySnapshot: Snapshot | null = null;
      if (hasUnsnapshottedChanges) {
        const safetyNumber = await this.snapshotRepository.getNextSequenceNumber(
          input.ownerId,
          input.projectId
        );
        safetySnapshot = new Snapshot({
          id: this.idGenerator.generate(),
          projectId: input.projectId,
          ownerId: input.ownerId,
          authorId: input.ownerId,
          number: safetyNumber,
          type: 'safety',
          title: 'Sécurité avant restauration',
          comment: null,
          projectTitle: project.getTitle(),
          chapters: project.getChapters().map((chapter) => ({
            id: chapter.getId(),
            title: chapter.getTitle(),
            content: chapter.getContent(),
            order: chapter.getOrder(),
          })),
          editorialMetadata: currentSettings ? snapshotEditorialMetadataFrom(currentSettings) : null,
        });
        await this.snapshotRepository.save(input.ownerId, safetySnapshot);
      }

      const restoreNumber = await this.snapshotRepository.getNextSequenceNumber(
        input.ownerId,
        input.projectId
      );
      const restoreSnapshot = new Snapshot({
        id: this.idGenerator.generate(),
        projectId: input.projectId,
        ownerId: input.ownerId,
        authorId: input.ownerId,
        number: restoreNumber,
        type: 'restore',
        title: `Restauration de la version ${source.getNumber()}`,
        comment: null,
        projectTitle: source.getProjectTitle(),
        chapters: source.getChapters(),
        editorialMetadata: source.getEditorialMetadata(),
        sourceSnapshotNumber: source.getNumber(),
      });
      await this.snapshotRepository.save(input.ownerId, restoreSnapshot);

      return { project: restoredProject, restoreSnapshot, safetySnapshot };
    } catch (error) {
      // No multi-document transaction is available (standalone MongoDB), so this
      // is a best-effort compensation: put the project's live content back the
      // way it was rather than leave it silently restored with no matching
      // history entry. A snapshot number already allocated above may still be
      // consumed with no snapshot saved for it — the same "numbers are never
      // reused" tradeoff SnapshotRepository already documents elsewhere.
      await this.projectRepository
        .replaceProjectIfUnchanged(input.ownerId, project, restoredProject.getUpdatedAt())
        .catch(() => undefined);
      throw error;
    }
  }
}
