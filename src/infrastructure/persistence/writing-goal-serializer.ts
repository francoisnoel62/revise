// ABOUTME: Serialization utilities for WritingGoal entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety

import { WritingGoal, WritingGoalProperties, GoalType } from '@/domain/entities/WritingGoal';
import { ObjectId } from 'mongodb';

export interface WritingGoalDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  type: GoalType;
  targetWords: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeWritingGoal(goal: WritingGoal): Omit<WritingGoalDocument, '_id'> & { _id: ObjectId } {
  return {
    _id: new ObjectId(goal.getId()),
    projectId: goal.getProjectId(),
    ownerId: goal.getOwnerId(),
    type: goal.getType(),
    targetWords: goal.getTargetWords(),
    deadline: goal.getDeadline() ?? undefined,
    createdAt: goal.getCreatedAt(),
    updatedAt: goal.getUpdatedAt(),
  };
}

export function deserializeWritingGoal(doc: WritingGoalDocument): WritingGoal {
  const props: WritingGoalProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    type: doc.type,
    targetWords: doc.targetWords,
    deadline: doc.deadline,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return WritingGoal.reconstruct(props);
}
