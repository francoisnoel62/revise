// ABOUTME: Serialization utilities for WritingQuota entity to/from MongoDB documents
// ABOUTME: Handles ObjectId and Date conversions

import { WritingQuota, WritingQuotaProperties, QuotaPeriod } from '@/domain/entities/WritingQuota';
import { ObjectId } from 'mongodb';

export interface WritingQuotaDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  period: QuotaPeriod;
  targetWords: number;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeWritingQuota(quota: WritingQuota): WritingQuotaDocument {
  return {
    _id: new ObjectId(quota.getId()),
    projectId: quota.getProjectId(),
    ownerId: quota.getOwnerId(),
    period: quota.getPeriod(),
    targetWords: quota.getTargetWords(),
    createdAt: quota.getCreatedAt(),
    updatedAt: quota.getUpdatedAt(),
  };
}

export function deserializeWritingQuota(doc: WritingQuotaDocument): WritingQuota {
  const props: WritingQuotaProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    period: doc.period,
    targetWords: doc.targetWords,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return WritingQuota.reconstruct(props);
}
