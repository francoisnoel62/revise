// ABOUTME: MongoDB implementation of WritingQuotaRepository
// ABOUTME: Provides persistence for recurring writing quotas with multi-tenant isolation

import { Db, ObjectId } from 'mongodb';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import { WritingQuota } from '@/domain/entities/WritingQuota';
import {
  WritingQuotaDocument,
  serializeWritingQuota,
  deserializeWritingQuota,
} from './writing-quota-serializer';

const COLLECTION_NAME = 'writingQuotas';

export class MongoDBWritingQuotaRepository implements WritingQuotaRepository {
  constructor(private readonly db: Db) {}

  async create(userId: string, quota: WritingQuota): Promise<WritingQuota> {
    if (quota.getOwnerId() !== userId) {
      throw new Error('Quota owner does not match user');
    }

    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);
    await collection.insertOne(serializeWritingQuota(quota));
    return quota;
  }

  async findById(userId: string, quotaId: string): Promise<WritingQuota | null> {
    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(quotaId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({ _id: objectId, ownerId: userId });
    return doc ? deserializeWritingQuota(doc) : null;
  }

  async findByProjectId(userId: string, projectId: string): Promise<WritingQuota[]> {
    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);

    const docs = await collection
      .find({ projectId, ownerId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(deserializeWritingQuota);
  }

  async update(userId: string, quota: WritingQuota): Promise<WritingQuota> {
    if (quota.getOwnerId() !== userId) {
      throw new Error('Quota owner does not match user');
    }

    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);
    const doc = serializeWritingQuota(quota);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Quota not found or access denied');
    }

    return quota;
  }

  async delete(userId: string, quotaId: string): Promise<void> {
    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(quotaId);
    } catch {
      throw new Error('Invalid quota ID');
    }

    const result = await collection.deleteOne({ _id: objectId, ownerId: userId });

    if (result.deletedCount === 0) {
      throw new Error('Quota not found or access denied');
    }
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<WritingQuotaDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }
}
