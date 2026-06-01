// ABOUTME: Serialization utilities for WordCountSnapshot entity to/from MongoDB documents
// ABOUTME: Handles ObjectId and Date conversions

import { WordCountSnapshot, WordCountSnapshotProperties } from '@/domain/entities/WordCountSnapshot';
import { ObjectId } from 'mongodb';

export interface WordCountSnapshotDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  localDate: string;
  totalWords: number;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeWordCountSnapshot(
  snapshot: WordCountSnapshot
): WordCountSnapshotDocument {
  return {
    _id: new ObjectId(snapshot.getId()),
    projectId: snapshot.getProjectId(),
    ownerId: snapshot.getOwnerId(),
    localDate: snapshot.getLocalDate(),
    totalWords: snapshot.getTotalWords(),
    createdAt: snapshot.getCreatedAt(),
    updatedAt: snapshot.getUpdatedAt(),
  };
}

export function deserializeWordCountSnapshot(
  doc: WordCountSnapshotDocument
): WordCountSnapshot {
  const props: WordCountSnapshotProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    localDate: doc.localDate,
    totalWords: doc.totalWords,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return WordCountSnapshot.reconstruct(props);
}
