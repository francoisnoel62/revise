// ABOUTME: Server Actions for manual project snapshots (creation and consultation).
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Project } from '@/domain/entities/Project';
import { Snapshot } from '@/domain/entities/Snapshot';
import { SnapshotType } from '@/domain/value-objects/SnapshotType';
import { CreateSnapshotUseCase } from '@/application/use-cases/CreateSnapshotUseCase';
import { ListSnapshotsUseCase } from '@/application/use-cases/ListSnapshotsUseCase';
import { RestoreSnapshotUseCase } from '@/application/use-cases/RestoreSnapshotUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getSnapshotRepo,
  getProjectSettingsRepo,
  getIdGenerator,
  withErrorHandling,
} from './utils';
import { SerializedProject } from './project-actions';

// Mirrors project-actions.ts's serializeProject (same convention as chapter-actions.ts)
function serializeProject(project: Project): SerializedProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getChapters().map((ch) => ({
      id: ch.getId(),
      title: ch.getTitle(),
      content: ch.getContent(),
      order: ch.getOrder(),
      metadata: {
        wordCount: ch.getMetadata().wordCount,
        characterCount: ch.getMetadata().characterCount,
        lastEdited: ch.getMetadata().lastEdited.toISOString(),
      },
    })),
    activeChapterId: project.getActiveChapterId(),
    providerId: project.getProviderId(),
    createdAt: project.getCreatedAt().toISOString(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}

/**
 * Serialized snapshot for client transport.
 */
export interface SerializedSnapshot {
  id: string;
  projectId: string;
  number: number;
  type: SnapshotType;
  title: string;
  comment: string | null;
  authorId: string;
  chapterCount: number;
  /** Chapter titles in order, for a lightweight structure preview (e.g. before restoring). */
  chapterTitles: string[];
  /** The source snapshot's number for a restore snapshot; null otherwise. Survives deletion of the source. */
  sourceSnapshotNumber: number | null;
  createdAt: string;
}

export interface SerializedSnapshotHistory {
  snapshots: SerializedSnapshot[];
  hasUnsnapshottedChanges: boolean;
}

function serializeSnapshot(snapshot: Snapshot): SerializedSnapshot {
  return {
    id: snapshot.getId(),
    projectId: snapshot.getProjectId(),
    number: snapshot.getNumber(),
    type: snapshot.getType(),
    title: snapshot.getTitle(),
    comment: snapshot.getComment(),
    authorId: snapshot.getAuthorId(),
    chapterCount: snapshot.getChapters().length,
    chapterTitles: snapshot.getChapters()
      .sort((a, b) => a.order - b.order)
      .map((chapter) => chapter.title),
    sourceSnapshotNumber: snapshot.getSourceSnapshotNumber(),
    createdAt: snapshot.getCreatedAt().toISOString(),
  };
}

/**
 * Create a manual snapshot of the current project state.
 * Callers must flush any unsaved editor content before invoking this action —
 * the snapshot captures whatever is currently persisted.
 */
export async function createSnapshotAction(
  projectId: string,
  title: string,
  comment?: string
): Promise<ActionResult<SerializedSnapshot>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CreateSnapshotUseCase(
      await getSnapshotRepo(),
      await getRepository(),
      await getProjectSettingsRepo(),
      await getIdGenerator()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      title,
      comment,
    });

    return serializeSnapshot(result.snapshot);
  });
}

/**
 * List the snapshot history for a project, newest first.
 * Also reports whether the current state has changed since the latest snapshot.
 */
export async function listSnapshotsAction(
  projectId: string
): Promise<ActionResult<SerializedSnapshotHistory>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListSnapshotsUseCase(
      await getSnapshotRepo(),
      await getRepository(),
      await getProjectSettingsRepo()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    return {
      snapshots: result.snapshots.map(serializeSnapshot),
      hasUnsnapshottedChanges: result.hasUnsnapshottedChanges,
    };
  });
}

export interface SerializedRestoreResult {
  project: SerializedProject;
  restoreSnapshot: SerializedSnapshot;
  /** The pre-restore state saved before restoring, or null if it was already snapshotted. */
  safetySnapshot: SerializedSnapshot | null;
}

/**
 * Restore a project to a past snapshot without losing history.
 * If the current state differs from the latest snapshot, a "Sécurité avant
 * restauration" snapshot is created first. Rejects with an error if the
 * project changed since `expectedProjectUpdatedAt` — the caller must reload.
 */
export async function restoreSnapshotAction(
  projectId: string,
  snapshotId: string,
  expectedProjectUpdatedAt: string
): Promise<ActionResult<SerializedRestoreResult>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new RestoreSnapshotUseCase(
      await getSnapshotRepo(),
      await getRepository(),
      await getProjectSettingsRepo(),
      await getIdGenerator()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      snapshotId,
      expectedProjectUpdatedAt: new Date(expectedProjectUpdatedAt),
    });

    return {
      project: serializeProject(result.project),
      restoreSnapshot: serializeSnapshot(result.restoreSnapshot),
      safetySnapshot: result.safetySnapshot ? serializeSnapshot(result.safetySnapshot) : null,
    };
  });
}
