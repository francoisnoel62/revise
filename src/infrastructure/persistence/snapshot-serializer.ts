// ABOUTME: Serialization utilities for Snapshot <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import {
  Snapshot,
  SnapshotChapter,
  SnapshotEditorialMetadata,
} from '@/domain/entities/Snapshot';
import { SnapshotType } from '@/domain/value-objects/SnapshotType';

/**
 * MongoDB document shape for Snapshot.
 */
export interface SnapshotDocument {
  _id: string;
  projectId: string;
  ownerId: string;
  authorId: string;
  number: number;
  type: SnapshotType;
  title: string;
  comment: string | null;
  projectTitle: string;
  chapters: SnapshotChapter[];
  editorialMetadata: SnapshotEditorialMetadata | null;
  sourceSnapshotNumber: number | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
  createdAt: Date;
}

/**
 * Convert Snapshot domain entity to MongoDB document.
 */
export function serializeSnapshot(snapshot: Snapshot): SnapshotDocument {
  return {
    _id: snapshot.getId(),
    projectId: snapshot.getProjectId(),
    ownerId: snapshot.getOwnerId(),
    authorId: snapshot.getAuthorId(),
    number: snapshot.getNumber(),
    type: snapshot.getType(),
    title: snapshot.getTitle(),
    comment: snapshot.getComment(),
    projectTitle: snapshot.getProjectTitle(),
    chapters: snapshot.getChapters(),
    editorialMetadata: snapshot.getEditorialMetadata(),
    sourceSnapshotNumber: snapshot.getSourceSnapshotNumber(),
    ...(snapshot.isDeleted()
      ? { deletedAt: snapshot.getDeletedAt(), deletedById: snapshot.getDeletedById() }
      : {}),
    createdAt: snapshot.getCreatedAt(),
  };
}

/**
 * Reconstruct Snapshot domain entity from MongoDB document.
 */
export function deserializeSnapshot(doc: SnapshotDocument): Snapshot {
  return new Snapshot({
    id: doc._id,
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    authorId: doc.authorId,
    number: doc.number,
    type: doc.type,
    title: doc.title,
    comment: doc.comment,
    projectTitle: doc.projectTitle,
    chapters: doc.chapters,
    editorialMetadata: doc.editorialMetadata,
    sourceSnapshotNumber: doc.sourceSnapshotNumber,
    deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
    deletedById: doc.deletedById ?? null,
    createdAt: new Date(doc.createdAt),
  });
}
