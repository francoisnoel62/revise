// ABOUTME: Server Actions for manual project snapshots (creation and consultation).
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Snapshot } from '@/domain/entities/Snapshot';
import { SnapshotType } from '@/domain/value-objects/SnapshotType';
import { CreateSnapshotUseCase } from '@/application/use-cases/CreateSnapshotUseCase';
import { ListSnapshotsUseCase } from '@/application/use-cases/ListSnapshotsUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getSnapshotRepo,
  getProjectSettingsRepo,
  getIdGenerator,
  withErrorHandling,
} from './utils';

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
