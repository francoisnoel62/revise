// ABOUTME: Serialization utilities for WordCountSnapshot entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety

import {
  WordCountSnapshot,
  WordCountSnapshotProperties,
} from '@/domain/entities/WordCountSnapshot';
import { ObjectId } from 'mongodb';

export interface WordCountSnapshotDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  date: Date;
  wordCount: number;
  createdAt: Date;
}

export function serializeWordCountSnapshot(
  snapshot: WordCountSnapshot
): Omit<WordCountSnapshotDocument, '_id'> & { _id: ObjectId } {
  return {
    _id: new ObjectId(snapshot.getId()),
    projectId: snapshot.getProjectId(),
    ownerId: snapshot.getOwnerId(),
    date: snapshot.getDate(),
    wordCount: snapshot.getWordCount(),
    createdAt: snapshot.getCreatedAt(),
  };
}

export function deserializeWordCountSnapshot(
  doc: WordCountSnapshotDocument
): WordCountSnapshot {
  const props: WordCountSnapshotProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    date: doc.date,
    wordCount: doc.wordCount,
    createdAt: doc.createdAt,
  };

  return WordCountSnapshot.reconstruct(props);
}
