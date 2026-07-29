// ABOUTME: Server Actions for manual project snapshots (creation and consultation).
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Project } from '@/domain/entities/Project';
import { Snapshot } from '@/domain/entities/Snapshot';
import { SnapshotType } from '@/domain/value-objects/SnapshotType';
import { CreateSnapshotUseCase } from '@/application/use-cases/CreateSnapshotUseCase';
import { ListSnapshotsUseCase } from '@/application/use-cases/ListSnapshotsUseCase';
import { RestoreSnapshotUseCase } from '@/application/use-cases/RestoreSnapshotUseCase';
import { LoadSnapshotComparisonUseCase } from '@/application/use-cases/LoadSnapshotComparisonUseCase';
import type { SnapshotChapter, SnapshotEditorialMetadata } from '@/domain/entities/Snapshot';
import { ProcessAutomaticSnapshotUseCase } from '@/application/use-cases/ProcessAutomaticSnapshotUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getSnapshotRepo,
  getAutomaticSnapshotRepo,
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
  nextBeforeNumber: number | null;
}

export interface SnapshotHistoryFilters {
  type?: SnapshotType;
  authorId?: string;
  from?: string;
  to?: string;
  beforeNumber?: number;
}

export interface SerializedSnapshotDetail extends SerializedSnapshot {
  projectTitle: string;
  chapters: SnapshotChapter[];
  editorialMetadata: SnapshotEditorialMetadata | null;
}

export interface SerializedSnapshotComparison {
  snapshot: SerializedSnapshotDetail;
  current: {
    projectTitle: string;
    chapters: SnapshotChapter[];
    editorialMetadata: SnapshotEditorialMetadata | null;
  };
  comparedAt: string;
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

    // Any snapshot, including a manual milestone, restarts the automatic clock.
    await (await getAutomaticSnapshotRepo()).completeSnapshot(auth.userId, projectId, null, new Date());

    return serializeSnapshot(result.snapshot);
  });
}

function serializeSnapshotDetail(snapshot: Snapshot): SerializedSnapshotDetail {
  return {
    ...serializeSnapshot(snapshot),
    projectTitle: snapshot.getProjectTitle(),
    chapters: snapshot.getChapters(),
    editorialMetadata: snapshot.getEditorialMetadata(),
  };
}

/**
 * Record an editor session heartbeat and let the server decide whether a snapshot is due.
 * The client interval is only a wake-up mechanism; the persisted schedule is the clock.
 */
export async function automaticSnapshotHeartbeatAction(
  projectId: string,
  sessionId: string,
  timeZone: string,
): Promise<ActionResult<{ created: boolean; error?: string; prunedCount: number }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ProcessAutomaticSnapshotUseCase(
      await getAutomaticSnapshotRepo(),
      await getSnapshotRepo(),
      await getRepository(),
      await getProjectSettingsRepo(),
      await getIdGenerator(),
    );
    return useCase.execute({ ownerId: auth.userId, projectId, sessionId, timeZone });
  });
}

/**
 * List the snapshot history for a project, newest first.
 * Also reports whether the current state has changed since the latest snapshot.
 */
export async function listSnapshotsAction(
  projectId: string,
  filters?: SnapshotHistoryFilters
): Promise<ActionResult<SerializedSnapshotHistory>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const snapshotRepo = await getSnapshotRepo();
    const pageSize = 20;
    const from = filters?.from ? new Date(filters.from) : undefined;
    const to = filters?.to ? new Date(`${filters.to}T23:59:59.999Z`) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      throw new Error('Période de filtre invalide');
    }
    const result = await new ListSnapshotsUseCase(
      snapshotRepo,
      await getRepository(),
      await getProjectSettingsRepo()
    ).execute({
      ownerId: auth.userId,
      projectId,
      page: {
        type: filters?.type,
        authorId: filters?.authorId,
        from,
        to,
        beforeNumber: filters?.beforeNumber,
        limit: pageSize,
      },
    });

    return {
      snapshots: result.snapshots.map(serializeSnapshot),
      hasUnsnapshottedChanges: result.hasUnsnapshottedChanges,
      nextBeforeNumber: result.nextBeforeNumber,
    };
  });
}

/** Load a read-only comparison from the persisted server state. */
export async function loadSnapshotComparisonAction(
  projectId: string,
  snapshotId: string,
): Promise<ActionResult<SerializedSnapshotComparison>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const result = await new LoadSnapshotComparisonUseCase(
      await getSnapshotRepo(),
      await getRepository(),
      await getProjectSettingsRepo(),
    ).execute({ ownerId: auth.userId, projectId, snapshotId });

    return {
      snapshot: serializeSnapshotDetail(result.snapshot),
      current: result.current,
      comparedAt: result.comparedAt.toISOString(),
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

    // A restoration is itself a snapshot creation and must restart the next due time.
    await (await getAutomaticSnapshotRepo()).completeSnapshot(auth.userId, projectId, null, new Date());

    return {
      project: serializeProject(result.project),
      restoreSnapshot: serializeSnapshot(result.restoreSnapshot),
      safetySnapshot: result.safetySnapshot ? serializeSnapshot(result.safetySnapshot) : null,
    };
  });
}
