// ABOUTME: MongoDB implementation of WritingGoalRepository
// ABOUTME: Provides persistence for writing goals with multi-tenant isolation

import { Db, ObjectId } from 'mongodb';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { WritingGoal } from '@/domain/entities/WritingGoal';
import {
  WritingGoalDocument,
  serializeWritingGoal,
  deserializeWritingGoal,
} from './writing-goal-serializer';

const COLLECTION_NAME = 'writingGoals';

export class MongoDBWritingGoalRepository implements WritingGoalRepository {
  constructor(private readonly db: Db) {}

  async create(userId: string, goal: WritingGoal): Promise<WritingGoal> {
    if (goal.getOwnerId() !== userId) {
      throw new Error('Goal owner does not match user');
    }

    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);
    const doc = serializeWritingGoal(goal);

    await collection.insertOne(doc);
    return goal;
  }

  async findById(userId: string, goalId: string): Promise<WritingGoal | null> {
    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(goalId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({
      _id: objectId,
      ownerId: userId,
    });

    return doc ? deserializeWritingGoal(doc) : null;
  }

  async findByProjectId(userId: string, projectId: string): Promise<WritingGoal[]> {
    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);

    const docs = await collection
      .find({
        projectId,
        ownerId: userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(deserializeWritingGoal);
  }

  async findActiveByProjectId(
    userId: string,
    projectId: string
  ): Promise<WritingGoal | null> {
    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);

    // Return the most recent 'total' type goal for the project
    const doc = await collection.findOne(
      {
        projectId,
        ownerId: userId,
        type: 'total',
      },
      { sort: { createdAt: -1 } }
    );

    return doc ? deserializeWritingGoal(doc) : null;
  }

  async update(userId: string, goal: WritingGoal): Promise<WritingGoal> {
    if (goal.getOwnerId() !== userId) {
      throw new Error('Goal owner does not match user');
    }

    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);
    const doc = serializeWritingGoal(goal);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Goal not found or access denied');
    }

    return goal;
  }

  async delete(userId: string, goalId: string): Promise<void> {
    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(goalId);
    } catch {
      throw new Error('Invalid goal ID');
    }

    const result = await collection.deleteOne({
      _id: objectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Goal not found or access denied');
    }
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<WritingGoalDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }
}
