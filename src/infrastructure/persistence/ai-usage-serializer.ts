// ABOUTME: Serialization utilities for AIUsageRecord entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety

import { AIUsageRecord, AIUsageRecordProperties } from '@/domain/entities/AIUsageRecord';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { ObjectId } from 'mongodb';

export interface AIUsageDocument {
  _id: ObjectId;
  userId: string;
  projectId: string;
  operation: AIOperationType;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens?: number | null;
  durationMs: number;
  createdAt: Date;
}

export function serializeAIUsage(
  record: AIUsageRecord
): Omit<AIUsageDocument, '_id'> & { _id: ObjectId } {
  return {
    _id: new ObjectId(record.getId()),
    userId: record.getUserId(),
    projectId: record.getProjectId(),
    operation: record.getOperation(),
    provider: record.getProvider(),
    model: record.getModel(),
    inputTokens: record.getInputTokens(),
    outputTokens: record.getOutputTokens(),
    cachedInputTokens: record.getCachedInputTokens(),
    durationMs: record.getDurationMs(),
    createdAt: record.getCreatedAt(),
  };
}

export function deserializeAIUsage(doc: AIUsageDocument): AIUsageRecord {
  const props: AIUsageRecordProperties = {
    id: doc._id.toHexString(),
    userId: doc.userId,
    projectId: doc.projectId,
    operation: doc.operation,
    provider: doc.provider,
    model: doc.model,
    inputTokens: doc.inputTokens,
    outputTokens: doc.outputTokens,
    cachedInputTokens: doc.cachedInputTokens ?? null,
    durationMs: doc.durationMs,
    createdAt: doc.createdAt,
  };

  return AIUsageRecord.reconstruct(props);
}
